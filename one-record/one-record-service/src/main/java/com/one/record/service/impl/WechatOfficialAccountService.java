package com.one.record.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.one.common.exception.ServiceException;
import com.one.common.util.JsonUtil;
import com.one.record.configuration.WechatOfficialAccountProperties;
import com.one.record.service.IWechatOfficialAccountService;
import com.one.record.wechat.WechatArticleRequest;
import com.one.record.wechat.WechatArticleListRequest;
import com.one.record.wechat.WechatDraftResult;
import com.one.record.wechat.WechatRenderedArticle;
import com.one.record.wechat.WechatTokenStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.commonmark.Extension;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.OutputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@AllArgsConstructor
public class WechatOfficialAccountService implements IWechatOfficialAccountService {

    private static final String TOKEN_CACHE_KEY = "wechat:official-account:access-token";
    private static final int MAX_DIGEST_BYTES = 120;
    private static final String FOOTER_TEXT = "由 OneAI Daily 自动发布。";
    private static final Pattern FRONT_MATTER = Pattern.compile("\\A---\\s*\\n(?<meta>.*?)\\n---\\s*\\n(?<body>.*)\\z", Pattern.DOTALL);
    private static final Pattern HEADING = Pattern.compile("^#\\s+(?<title>.+?)\\s*$", Pattern.MULTILINE);
    private static final Pattern INTERNAL_NOTES = Pattern.compile("(?ms)^#{1,6}\\s*(?:发布备注|备注|内部备注|草稿备注|Notes|Publishing Notes)\\s*$.*\\z");
    private static final Pattern TAG = Pattern.compile("<[^>]+>");
    private static final Pattern IMG_SRC = Pattern.compile("(<img\\b[^>]*?\\bsrc=\")([^\"]+)(\"[^>]*>)");
    private static final Pattern UNICODE_ESCAPE = Pattern.compile("\\\\([uU])([0-9a-fA-F]{4,8})");

    private final WechatOfficialAccountProperties properties;
    private final RestTemplate restTemplate;
    private final StringRedisTemplate redisTemplate;

    @Override
    public WechatRenderedArticle render(WechatArticleRequest request) {
        ArticleSource source = articleSource(request);
        return renderArticle(request, source, null);
    }

    @Override
    public WechatDraftResult createDraft(WechatArticleRequest request) {
        String accessToken = usableAccessToken();
        ArticleSource source = articleSource(request);
        List<Path> tempFiles = new ArrayList<>();
        try {
            WechatRenderedArticle article = renderArticle(request, source, src -> uploadArticleImage(accessToken, source, src, tempFiles));
            String mediaId = addDraft(accessToken, article);
            Map<String, Object> publishResponse = null;
            boolean publishSubmitted = Boolean.TRUE.equals(request != null && request.getPublishAfterDraft());
            if (publishSubmitted) {
                publishResponse = submitPublish(mediaId);
            }
            return WechatDraftResult.builder()
                    .dryRun(false)
                    .mediaId(mediaId)
                    .publishSubmitted(publishSubmitted)
                    .publishResponse(publishResponse)
                    .article(article)
                    .build();
        } finally {
            tempFiles.forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (Exception e) {
                    log.debug("Failed to delete temp WeChat image: {}", path, e);
                }
            });
        }
    }

    @Override
    public Map<String, Object> listDrafts(WechatArticleListRequest request) {
        return batchGet("/cgi-bin/draft/batchget", request);
    }

    @Override
    public Map<String, Object> listPublishedArticles(WechatArticleListRequest request) {
        return batchGet("/cgi-bin/freepublish/batchget", request);
    }

    @Override
    public Map<String, Object> submitPublish(String mediaId) {
        if (!hasText(mediaId)) {
            throw new ServiceException("微信公众号草稿 media_id 不能为空");
        }
        Map<String, Object> body = new HashMap<>();
        body.put("media_id", mediaId.trim());
        return wechatRequest(HttpMethod.POST, "/cgi-bin/freepublish/submit", accessTokenParams(usableAccessToken()), body);
    }

    @Override
    public String refreshAccessToken() {
        requireCredential();
        Map<String, Object> body = new HashMap<>();
        body.put("grant_type", "client_credential");
        body.put("appid", properties.getAppId());
        body.put("secret", properties.getAppSecret());
        body.put("force_refresh", false);
        Map<String, Object> response = wechatRequest(HttpMethod.POST, "/cgi-bin/stable_token", null, body);
        Object tokenValue = response.get("access_token");
        if (!(tokenValue instanceof String token) || !hasText(token)) {
            throw new ServiceException("微信公众号 token 响应缺少 access_token: {}", response);
        }

        long now = now();
        Number expiresIn = response.get("expires_in") instanceof Number number ? number : 7200;
        long expiresAt = now + Duration.ofSeconds(expiresIn.longValue()).toMillis();
        TokenCache cache = new TokenCache();
        cache.setAccessToken(token);
        cache.setUpdatedAt(now);
        cache.setExpiresAt(expiresAt);
        if (Boolean.TRUE.equals(properties.getCacheToken())) {
            redisTemplate.opsForValue().set(TOKEN_CACHE_KEY, JsonUtil.toJson(cache), Duration.ofSeconds(Math.max(60, expiresIn.longValue() - properties.getTokenRefreshSkewSeconds())));
        }
        return token;
    }

    @Override
    public WechatTokenStatus tokenStatus() {
        TokenCache cache = readTokenCache();
        return WechatTokenStatus.builder()
                .configured(hasText(properties.getAppId()) && hasText(properties.getAppSecret()))
                .cached(cache != null && hasText(cache.getAccessToken()))
                .expiresAt(cache == null ? null : cache.getExpiresAt())
                .updatedAt(cache == null ? null : cache.getUpdatedAt())
                .build();
    }

    private WechatRenderedArticle renderArticle(WechatArticleRequest request, ArticleSource source, ImageUrlResolver imageUrlResolver) {
        Map<String, String> meta = source.getMeta();
        String body = source.getBody();
        String title = firstText(
                request == null ? null : request.getTitle(),
                meta.get("wechat_title"),
                meta.get("title"),
                extractTitle(body),
                source.getName()
        );
        body = stripLeadingH1(body);
        body = stripInternalNotes(body);

        List<Extension> extensions = List.of(TablesExtension.create());
        Parser parser = Parser.builder().extensions(extensions).build();
        HtmlRenderer renderer = HtmlRenderer.builder().extensions(extensions).build();
        Node document = parser.parse(body);
        String html = renderer.render(document);
        if (imageUrlResolver != null && Boolean.TRUE.equals(request == null ? Boolean.TRUE : request.getUploadImages())) {
            html = resolveImageUrls(html, imageUrlResolver);
        }
        html = styleWechatBlocks(html);

        String digest = firstText(meta.get("digest"), buildDigest(html));
        return WechatRenderedArticle.builder()
                .title(limit(ensureWechatTitle(title), 64))
                .author(firstText(request == null ? null : request.getAuthor(), meta.get("author"), properties.getAuthor()))
                .digest(limitUtf8Bytes(digest, MAX_DIGEST_BYTES))
                .content(wrapForWechat(html))
                .contentSourceUrl(firstText(request == null ? null : request.getContentSourceUrl(), meta.get("content_source_url"), ""))
                .thumbMediaId(firstText(request == null ? null : request.getThumbMediaId(), meta.get("cover_media_id"), meta.get("thumb_media_id"), properties.getThumbMediaId()))
                .needOpenComment(intFlag(firstText(stringValue(request == null ? null : request.getNeedOpenComment()), meta.get("need_open_comment")), properties.getNeedOpenComment()))
                .onlyFansCanComment(intFlag(firstText(stringValue(request == null ? null : request.getOnlyFansCanComment()), meta.get("only_fans_can_comment")), properties.getOnlyFansCanComment()))
                .showCoverPic(intFlag(firstText(stringValue(request == null ? null : request.getShowCoverPic()), meta.get("show_cover_pic")), 0))
                .build();
    }

    private String addDraft(String accessToken, WechatRenderedArticle article) {
        if (!hasText(article.getTitle()) || !hasText(article.getThumbMediaId()) || !hasText(article.getContent())) {
            throw new ServiceException("微信公众号草稿缺少必要字段 title/thumbMediaId/content");
        }
        Map<String, Object> body = new HashMap<>();
        body.put("articles", Collections.singletonList(articlePayload(article)));
        Map<String, Object> response = wechatRequest(HttpMethod.POST, "/cgi-bin/draft/add", accessTokenParams(accessToken), body);
        Object mediaId = response.get("media_id");
        if (!(mediaId instanceof String value) || !hasText(value)) {
            throw new ServiceException("微信公众号草稿响应缺少 media_id: {}", response);
        }
        return value;
    }

    private Map<String, Object> articlePayload(WechatRenderedArticle article) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", article.getTitle());
        payload.put("author", article.getAuthor());
        payload.put("digest", article.getDigest());
        payload.put("content", article.getContent());
        payload.put("content_source_url", article.getContentSourceUrl());
        payload.put("thumb_media_id", article.getThumbMediaId());
        payload.put("need_open_comment", article.getNeedOpenComment());
        payload.put("only_fans_can_comment", article.getOnlyFansCanComment());
        payload.put("show_cover_pic", article.getShowCoverPic());
        return payload;
    }

    private Map<String, Object> batchGet(String path, WechatArticleListRequest request) {
        WechatArticleListRequest normalized = normalizeListRequest(request);
        Map<String, Object> body = new HashMap<>();
        body.put("offset", normalized.getOffset());
        body.put("count", normalized.getCount());
        body.put("no_content", normalized.getNoContent());
        return wechatRequest(HttpMethod.POST, path, accessTokenParams(usableAccessToken()), body);
    }

    private WechatArticleListRequest normalizeListRequest(WechatArticleListRequest request) {
        WechatArticleListRequest normalized = request == null ? new WechatArticleListRequest() : request;
        normalized.setOffset(Math.max(0, normalized.getOffset() == null ? 0 : normalized.getOffset()));
        Integer count = normalized.getCount() == null ? 10 : normalized.getCount();
        normalized.setCount(Math.max(1, Math.min(20, count)));
        normalized.setNoContent(normalized.getNoContent() == null || normalized.getNoContent() != 0 ? 1 : 0);
        return normalized;
    }

    private String uploadArticleImage(String accessToken, ArticleSource source, String src, List<Path> tempFiles) {
        URI uri = URI.create(src);
        if (hasText(uri.getScheme()) && List.of("http", "https", "data").contains(uri.getScheme())) {
            return src;
        }

        Path imagePath = Path.of(uri.getPath());
        if (!imagePath.isAbsolute()) {
            Path baseDir = source.getBaseDir();
            if (baseDir == null) {
                throw new ServiceException("Markdown 正文图片使用相对路径时必须提供 postPath: {}", src);
            }
            imagePath = baseDir.resolve(imagePath);
        }
        imagePath = imagePath.normalize().toAbsolutePath();
        if (!Files.exists(imagePath)) {
            throw new ServiceException("微信公众号正文图片不存在: {}", imagePath);
        }

        Path uploadPath = prepareUploadImage(imagePath, tempFiles);
        String url = UriComponentsBuilder.fromUriString(apiBaseUrl() + "/cgi-bin/media/uploadimg")
                .queryParam("access_token", accessToken)
                .build()
                .encode()
                .toUriString();
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("media", new FileSystemResource(uploadPath));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(form, headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    }
            );
            Map<String, Object> body = checkedWechatBody(response.getBody(), "微信公众号正文图片上传失败");
            Object imageUrl = body.get("url");
            if (!(imageUrl instanceof String value) || !hasText(value)) {
                throw new ServiceException("微信公众号图片上传响应缺少 url: {}", body);
            }
            return value;
        } catch (HttpStatusCodeException e) {
            throw wechatHttpException("微信公众号正文图片上传失败", "/cgi-bin/media/uploadimg", e);
        }
    }

    private Path prepareUploadImage(Path imagePath, List<Path> tempFiles) {
        String suffix = suffix(imagePath);
        if (List.of(".png", ".jpg", ".jpeg").contains(suffix)) {
            return imagePath;
        }
        if (".svg".equals(suffix)) {
            try {
                Path pngPath = Files.createTempFile("one-wechat-image-", ".png");
                tempFiles.add(pngPath);
                PNGTranscoder transcoder = new PNGTranscoder();
                transcoder.addTranscodingHint(PNGTranscoder.KEY_WIDTH, 1200f);
                transcoder.addTranscodingHint(PNGTranscoder.KEY_HEIGHT, 675f);
                try (OutputStream outputStream = Files.newOutputStream(pngPath)) {
                    transcoder.transcode(new TranscoderInput(imagePath.toUri().toString()), new TranscoderOutput(outputStream));
                }
                return pngPath;
            } catch (Exception e) {
                throw new ServiceException("SVG 转 PNG 失败: {}", e.getMessage());
            }
        }
        throw new ServiceException("微信公众号正文图片仅支持 png/jpg/jpeg/svg: {}", imagePath);
    }

    private Map<String, Object> wechatRequest(HttpMethod method, String path, Map<String, String> params, Object body) {
        String url = UriComponentsBuilder.fromUriString(apiBaseUrl() + path)
                .queryParams(toMultiValueMap(params))
                .build()
                .encode()
                .toUriString();
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        Object requestBody = body;
        if (body != null) {
            String jsonBody = JsonUtil.toJson(body);
            requestBody = jsonBody;
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentLength(jsonBody.getBytes(StandardCharsets.UTF_8).length);
        }
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url,
                    method,
                    new HttpEntity<>(requestBody, headers),
                    byte[].class
            );
            return checkedWechatBody(parseWechatBody(response.getBody(), path), "微信公众号 API 请求失败");
        } catch (HttpStatusCodeException e) {
            throw wechatHttpException("微信公众号 API 请求失败", path, e);
        }
    }

    private Map<String, Object> parseWechatBody(byte[] responseBody, String path) {
        String body = responseBody == null ? "" : new String(responseBody, StandardCharsets.UTF_8);
        if (!hasText(body)) {
            throw new ServiceException("微信公众号 API 响应为空: path={}", path);
        }
        try {
            return JsonUtil.toObject(body, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            throw new ServiceException("微信公众号 API 响应不是 JSON: path={}, body={}", path, body);
        }
    }

    private Map<String, Object> checkedWechatBody(Map<String, Object> body, String message) {
        if (body == null) {
            throw new ServiceException("{}: 响应为空", message);
        }
        Object errcode = body.get("errcode");
        if (errcode instanceof Number number && number.intValue() != 0) {
            throw new ServiceException("{}: errcode={}, errmsg={}, response={}", message, number, body.get("errmsg"), body);
        }
        return body;
    }

    private ServiceException wechatHttpException(String prefix, String path, HttpStatusCodeException e) {
        String detail = e.getResponseBodyAsString(StandardCharsets.UTF_8);
        try {
            detail = String.valueOf(JsonUtil.toObject(detail, new TypeReference<Map<String, Object>>() {
            }));
        } catch (Exception ignored) {
            log.debug("WeChat error response is not JSON: {}", detail);
        }
        if (!hasText(detail)) {
            detail = "empty body; if this is a JSON request, verify Content-Length is sent and AppID/AppSecret/IP whitelist are correct";
        }
        return new ServiceException("{}: path={}, status={}, body={}", prefix, path, e.getStatusCode(), detail);
    }

    private ArticleSource articleSource(WechatArticleRequest request) {
        if (request == null) {
            throw new ServiceException("微信公众号文章请求不能为空");
        }
        String markdown = request.getMarkdown();
        Path path = null;
        if (!hasText(markdown)) {
            if (!hasText(request.getPostPath())) {
                throw new ServiceException("markdown 和 postPath 不能同时为空");
            }
            path = Path.of(request.getPostPath()).toAbsolutePath().normalize();
            try {
                markdown = Files.readString(path, StandardCharsets.UTF_8);
            } catch (Exception e) {
                throw new ServiceException("读取微信公众号 Markdown 失败: {}", e.getMessage());
            }
        }
        markdown = decodeUnicodeEscapeLiterals(markdown);
        Matcher matcher = FRONT_MATTER.matcher(markdown);
        Map<String, String> meta = new HashMap<>();
        String body = markdown;
        if (matcher.matches()) {
            meta = parseFrontMatter(matcher.group("meta"));
            body = matcher.group("body");
        }
        ArticleSource source = new ArticleSource();
        source.setMeta(meta);
        source.setBody(body);
        source.setName(path == null ? "OneAI Daily" : path.getFileName().toString().replaceFirst("\\.md$", ""));
        source.setBaseDir(path == null ? null : path.getParent());
        return source;
    }

    private Map<String, String> parseFrontMatter(String value) {
        Map<String, String> meta = new HashMap<>();
        for (String rawLine : value.split("\\R")) {
            String line = rawLine.trim();
            if (!hasText(line) || line.startsWith("#")) {
                continue;
            }
            int index = line.indexOf(':');
            if (index <= 0) {
                continue;
            }
            meta.put(line.substring(0, index).trim(), stripQuotes(line.substring(index + 1).trim()));
        }
        return meta;
    }

    private String usableAccessToken() {
        TokenCache cache = readTokenCache();
        long refreshAt = now() + Duration.ofSeconds(properties.getTokenRefreshSkewSeconds()).toMillis();
        if (cache != null && hasText(cache.getAccessToken()) && cache.getExpiresAt() != null && cache.getExpiresAt() > refreshAt) {
            return cache.getAccessToken();
        }
        return refreshAccessToken();
    }

    private TokenCache readTokenCache() {
        try {
            String value = redisTemplate.opsForValue().get(TOKEN_CACHE_KEY);
            if (!hasText(value)) {
                return null;
            }
            return JsonUtil.toObject(value, TokenCache.class);
        } catch (Exception e) {
            throw new ServiceException("微信公众号 token 缓存读取失败: {}", e.getMessage());
        }
    }

    private Map<String, String> accessTokenParams(String accessToken) {
        Map<String, String> params = new HashMap<>();
        params.put("access_token", accessToken);
        return params;
    }

    private MultiValueMap<String, String> toMultiValueMap(Map<String, String> params) {
        MultiValueMap<String, String> values = new LinkedMultiValueMap<>();
        if (params != null) {
            params.forEach(values::add);
        }
        return values;
    }

    private String wrapForWechat(String html) {
        String footer = html.contains(FOOTER_TEXT)
                ? ""
                : "<p style=\"margin:30px 0 0;color:#8a8f98;font-size:13px;line-height:1.7;\">" + FOOTER_TEXT + "</p>\n";
        return "<section style=\"font-size:17px;line-height:1.9;color:#1f2328;\">\n"
                + html + "\n" + footer + "</section>";
    }

    private String styleWechatBlocks(String html) {
        return html
                .replace("<h1>", "<h1 style=\"margin:0 0 24px;font-size:28px;line-height:1.35;font-weight:700;color:#111827;\">")
                .replace("<h2>", "<h2 style=\"margin:38px 0 18px;padding-top:4px;font-size:22px;line-height:1.45;font-weight:700;color:#111827;\">")
                .replace("<h3>", "<h3 style=\"margin:30px 0 14px;font-size:19px;line-height:1.5;font-weight:700;color:#111827;\">")
                .replace("<p>", "<p style=\"margin:16px 0;line-height:1.95;color:#1f2328;\">")
                .replace("<blockquote>", "<blockquote style=\"margin:24px 0;padding:10px 0 10px 16px;border-left:4px solid #d1d5db;color:#4b5563;background:#f9fafb;\">")
                .replaceAll("<hr\\s*/?>", "<hr style=\"border:none;border-top:1px solid #e5e7eb;margin:34px 0;\">");
    }

    private String resolveImageUrls(String html, ImageUrlResolver resolver) {
        Matcher matcher = IMG_SRC.matcher(html);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(result, Matcher.quoteReplacement(matcher.group(1) + resolver.resolve(matcher.group(2)) + matcher.group(3)));
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private String extractTitle(String body) {
        Matcher matcher = HEADING.matcher(body);
        return matcher.find() ? matcher.group("title").trim() : "";
    }

    private String stripLeadingH1(String body) {
        return body.replaceFirst("\\A\\s*#\\s+.+?(?:\\n+|\\z)", "");
    }

    private String stripInternalNotes(String body) {
        return INTERNAL_NOTES.matcher(body).replaceAll("").trim() + "\n";
    }

    private String buildDigest(String html) {
        String text = TAG.matcher(html).replaceAll(" ").replaceAll("\\s+", " ").trim();
        return hasText(text) ? text : "OneAI Daily";
    }

    private String decodeUnicodeEscapeLiterals(String value) {
        Matcher matcher = UNICODE_ESCAPE.matcher(value);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            String marker = matcher.group(1);
            String digits = matcher.group(2);
            if (("u".equals(marker) && digits.length() != 4) || ("U".equals(marker) && digits.length() != 8)) {
                continue;
            }
            try {
                matcher.appendReplacement(result, Matcher.quoteReplacement(String.valueOf(Character.toChars(Integer.parseInt(digits, 16)))));
            } catch (Exception ignored) {
                log.debug("Invalid unicode escape: {}", matcher.group());
            }
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private String ensureWechatTitle(String title) {
        String value = title.trim();
        return value.startsWith("OneAI Daily｜") ? value : "OneAI Daily｜" + value;
    }

    private String limit(String value, int maxChars) {
        String trimmed = value.trim();
        if (trimmed.length() <= maxChars) {
            return trimmed;
        }
        return trimmed.substring(0, maxChars - 1).trim() + "...";
    }

    private String limitUtf8Bytes(String value, int maxBytes) {
        String trimmed = value.trim();
        if (trimmed.getBytes(StandardCharsets.UTF_8).length <= maxBytes) {
            return trimmed;
        }
        String suffix = "...";
        int budget = maxBytes - suffix.getBytes(StandardCharsets.UTF_8).length;
        StringBuilder result = new StringBuilder();
        int used = 0;
        for (int i = 0; i < trimmed.length(); i++) {
            String current = String.valueOf(trimmed.charAt(i));
            int bytes = current.getBytes(StandardCharsets.UTF_8).length;
            if (used + bytes > budget) {
                break;
            }
            result.append(current);
            used += bytes;
        }
        return result.toString().trim() + suffix;
    }

    private Integer intFlag(String value, Integer defaultValue) {
        if (!hasText(value)) {
            return defaultValue != null && defaultValue != 0 ? 1 : 0;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (List.of("1", "true", "yes", "on").contains(normalized)) {
            return 1;
        }
        if (List.of("0", "false", "no", "off").contains(normalized)) {
            return 0;
        }
        return Integer.parseInt(value) == 0 ? 0 : 1;
    }

    private String stripQuotes(String value) {
        if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String suffix(Path path) {
        String name = path.getFileName().toString();
        int index = name.lastIndexOf('.');
        return index < 0 ? "" : name.substring(index).toLowerCase(Locale.ROOT);
    }

    private String apiBaseUrl() {
        String value = firstText(properties.getApiBaseUrl(), "https://api.weixin.qq.com");
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private void requireCredential() {
        if (!hasText(properties.getAppId())) {
            throw new ServiceException("缺少微信公众号 appId，请配置 wechat.official-account.app-id");
        }
        if (!hasText(properties.getAppSecret())) {
            throw new ServiceException("缺少微信公众号 appSecret，请配置 wechat.official-account.app-secret");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private long now() {
        return System.currentTimeMillis();
    }

    @FunctionalInterface
    private interface ImageUrlResolver {
        String resolve(String src);
    }

    @Data
    private static class ArticleSource {
        private Map<String, String> meta;
        private String body;
        private String name;
        private Path baseDir;
    }

    @Data
    private static class TokenCache {
        private String accessToken;
        private Long expiresAt;
        private Long updatedAt;
    }
}
