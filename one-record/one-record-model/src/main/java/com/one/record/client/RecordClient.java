package com.one.record.client;

import cn.hutool.core.date.DateUtil;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import com.one.common.util.JsonUtil;
import com.one.common.util.ListUtil;
import com.one.common.util.StreamUtil;
import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.response.RecordResponse;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
public class RecordClient {

    private static final String URL = "http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";

    public static final String AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

    public static final OkHttpClient CLIENT = new OkHttpClient()
            .newBuilder()
            .connectTimeout(21, TimeUnit.DAYS)
            .followRedirects(false)
            .readTimeout(21, TimeUnit.DAYS)
            .addNetworkInterceptor(new Retry())
            .build();

    public static Request buildRequest(String url, String cookie) {
        Request.Builder builder = new Request.Builder()
                .get()
                .url(url)
                .addHeader("User-Agent", AGENT);
        if (cookie != null && !cookie.isBlank()) {
            builder.addHeader("Cookie", cookie);
        }
        return builder.build();
    }

    public static Record last() {
        return record(1).get(0);
    }

    public static List<Record> year() {
        return year(RecordClientOptions.defaults());
    }

    public static List<Record> year(RecordClientOptions options) {
        return StreamUtil.iterate(2013, DateUtil.thisYear(), year -> year(year, options));
    }

    public static List<Record> year(int year) {
        return year(year, RecordClientOptions.defaults());
    }

    public static List<Record> year(int year, RecordClientOptions options) {
        return ListUtil.merge(
                record(year + "-01-01", year + "-06-30", options),
                record(year + "-07-01", year + "-12-31", options)
        );
    }

    public static List<Record> record(long issueCount) {
        return record(RecordRequest.by(issueCount), RecordClientOptions.defaults());
    }

    public static List<Record> record(String start, String end) {
        return record(start, end, RecordClientOptions.defaults());
    }

    public static List<Record> record(String start, String end, RecordClientOptions options) {
        return record(RecordRequest.by(start, end), options);
    }

    public static List<Record> record(RecordRequest request) {
        return record(request, RecordClientOptions.defaults());
    }

    public static List<Record> record(RecordRequest request, RecordClientOptions options) {
        RecordResponse response = get(request, RecordResponse.class, options);
        return recordsFromResponse(response, options);
    }

    public static <T> T get(Object request, Class<T> tClass) {
        return get(request, tClass, RecordClientOptions.defaults());
    }

    public static <T> T get(Object request, Class<T> tClass, RecordClientOptions options) {
        Map<?, ?> params = JsonUtil.toObject(JsonUtil.toJson(request), Map.class);
        String response = get(params, options);
        return parseResponse(response, tClass, options);
    }

    public static String get(Map<?, ?> params) {
        return get(params, RecordClientOptions.defaults());
    }

    public static String get(Map<?, ?> params, RecordClientOptions options) {
        String param = StreamUtil.joining(params.entrySet(),
                entry -> entry.getKey() + "=" + entry.getValue(),
                "&", "?", "");
        return get(URL + param, "", options);
    }

    public static String get(String url, String cookie) {
        return get(url, cookie, RecordClientOptions.defaults());
    }

    public static String get(String url, String cookie, RecordClientOptions options) {
        return execute(url, cookie, options, 0).content();
    }

    public static RecordClientDiagnostic diagnose(RecordRequest request, RecordClientOptions options) {
        long startedAt = System.currentTimeMillis();
        try {
            Map<?, ?> params = JsonUtil.toObject(JsonUtil.toJson(request), Map.class);
            String param = StreamUtil.joining(params.entrySet(),
                    entry -> entry.getKey() + "=" + entry.getValue(),
                    "&", "?", "");
            HttpResult result = execute(URL + param, "", options, 0);
            RecordResponse response = parseResponse(result.content(), RecordResponse.class, options);
            List<Record> records = recordsFromResponse(response, options);
            return diagnostic(true, null, "provider 探测成功", records == null ? 0 : records.size(), result,
                    options, startedAt, false);
        } catch (RecordClientException exception) {
            return diagnostic(false, exception.getFailureCategory(), exception.getMessage(), 0,
                    new HttpResult(null, exception.getHttpStatus(), exception.getResponseContentType(), exception.getResponseSnippet()),
                    options, startedAt, Boolean.TRUE.equals(exception.getNetworkBlockSuspected()));
        } catch (RuntimeException exception) {
            return diagnostic(false, "REQUEST_EXCEPTION", exception.getMessage(), 0,
                    new HttpResult(null, null, null, null), options, startedAt, false);
        }
    }

    private static HttpResult execute(String url, String cookie, RecordClientOptions options, int redirectCount) {
        if (url == null || url.isBlank()) {
            throw exception("彩票开奖接口请求地址为空", "REQUEST_INVALID", null, null, null, options, false, null);
        }
        if (redirectCount > 5) {
            throw exception("彩票开奖接口重定向次数过多", "TOO_MANY_REDIRECTS", null, null, null, options, false, null);
        }
        Request request = buildRequest(url, cookie);
        try {
            try (Response response = client(options).newCall(request).execute()) {
                if (response.isRedirect()) {
                    String location = response.header("Location");
                    if (location == null || location.isBlank()) {
                        throw exception("彩票开奖接口重定向地址为空", "INVALID_REDIRECT", response.code(),
                                responseContentType(response), null, options, false, null);
                    }
                    return execute(location, response.header("Set-Cookie"), options, redirectCount + 1);
                }
                String contentType = responseContentType(response);
                String content = responseContent(response);
                String snippet = abbreviate(content, snippetLength(options));
                if (response.isSuccessful()) {
                    return new HttpResult(content, response.code(), contentType, snippet);
                } else {
                    log.error("\n> 请求失败, 错误码: {}", response.code());
                    throw exception("彩票开奖接口请求失败，HTTP " + response.code(),
                            networkBlockStatus(response.code()) ? "PROXY_OR_NETWORK_BLOCK" : "HTTP_FAILURE",
                            response.code(), contentType, snippet, options, networkBlockStatus(response.code()), null);
                }
            }
        } catch (IOException e) {
            log.error("\n> 请求异常, " + e.getMessage(), e);
            throw exception("彩票开奖接口请求异常: " + e.getMessage(), "REQUEST_EXCEPTION", null, null, null, options, false, e);
        }
    }

    static List<Record> recordsFromResponse(RecordResponse response) {
        return recordsFromResponse(response, RecordClientOptions.defaults());
    }

    static List<Record> recordsFromResponse(RecordResponse response, RecordClientOptions options) {
        if (response == null) {
            throw exception("彩票开奖接口响应为空", "BLANK_RESPONSE", null, null, null, options, false, null);
        }
        if (!response.success()) {
            String message = response.getMessage() == null || response.getMessage().isBlank()
                    ? "state=" + response.getState()
                    : response.getMessage();
            throw exception("彩票开奖接口返回失败: " + message, "BUSINESS_FAILURE", null, null, null, options, false, null);
        }
        return response.getResult() == null ? List.of() : response.getResult();
    }

    static <T> T parseResponse(String response, Class<T> tClass) {
        return parseResponse(response, tClass, RecordClientOptions.defaults());
    }

    static <T> T parseResponse(String response, Class<T> tClass, RecordClientOptions options) {
        if (response == null || response.isBlank()) {
            throw exception("彩票开奖接口未返回内容", "BLANK_RESPONSE", null, null, abbreviate(response, snippetLength(options)), options, false, null);
        }
        try {
            return JsonUtil.toObject(response, tClass);
        } catch (RuntimeException exception) {
            throw exception("彩票开奖接口响应解析失败: " + abbreviate(response, snippetLength(options)),
                    exception, "INVALID_JSON", null, null, abbreviate(response, snippetLength(options)), options, false);
        }
    }

    private static String abbreviate(String value) {
        return abbreviate(value, 160);
    }

    private static String abbreviate(String value, int limit) {
        String safeValue = value == null ? "" : value.replaceAll("\\s+", " ").trim();
        int safeLimit = limit <= 0 ? 160 : limit;
        return safeValue.length() <= safeLimit ? safeValue : safeValue.substring(0, safeLimit) + "...";
    }

    private static String responseContent(Response response) throws IOException {
        ResponseBody body = response.body();
        return body == null ? null : body.string();
    }

    private static String responseContentType(Response response) {
        ResponseBody body = response.body();
        if (body != null && body.contentType() != null) {
            return body.contentType().toString();
        }
        return response.header("Content-Type");
    }

    private static OkHttpClient client(RecordClientOptions options) {
        RecordClientOptions safeOptions = options == null ? RecordClientOptions.defaults() : options;
        OkHttpClient.Builder builder = CLIENT.newBuilder();
        Integer timeoutSeconds = safeOptions.getTimeoutSeconds();
        if (timeoutSeconds != null && timeoutSeconds > 0) {
            builder.connectTimeout(timeoutSeconds, TimeUnit.SECONDS)
                    .readTimeout(timeoutSeconds, TimeUnit.SECONDS);
        }
        String networkMode = networkMode(safeOptions);
        if (RecordClientOptions.NETWORK_MODE_DIRECT.equals(networkMode)) {
            builder.proxy(Proxy.NO_PROXY);
        } else if (RecordClientOptions.NETWORK_MODE_PROXY.equals(networkMode)) {
            String proxyHost = safeOptions.getProxyHost();
            Integer proxyPort = safeOptions.getProxyPort();
            if (proxyHost == null || proxyHost.isBlank() || proxyPort == null || proxyPort <= 0) {
                throw exception("彩票开奖接口代理配置不完整", "PROXY_CONFIG_INVALID", null, null, null, safeOptions, false, null);
            }
            builder.proxy(new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyHost.trim(), proxyPort)));
        }
        return builder.build();
    }

    private static RecordClientDiagnostic diagnostic(boolean success,
                                                     String failureCategory,
                                                     String message,
                                                     Integer recordCount,
                                                     HttpResult result,
                                                     RecordClientOptions options,
                                                     long startedAt,
                                                     boolean networkBlockSuspected) {
        long finishedAt = System.currentTimeMillis();
        return RecordClientDiagnostic.builder()
                .success(success)
                .failureCategory(failureCategory)
                .message(message)
                .recordCount(recordCount)
                .durationMs(Math.max(0L, finishedAt - startedAt))
                .checkedAt(finishedAt)
                .provider(provider(options))
                .networkMode(networkMode(options))
                .httpStatus(result == null ? null : result.httpStatus())
                .responseContentType(result == null ? null : result.contentType())
                .responseSnippet(result == null ? null : result.snippet())
                .networkBlockSuspected(networkBlockSuspected)
                .build();
    }

    private static RecordClientException exception(String message,
                                                   String failureCategory,
                                                   Integer httpStatus,
                                                   String responseContentType,
                                                   String responseSnippet,
                                                   RecordClientOptions options,
                                                   boolean networkBlockSuspected,
                                                   Throwable cause) {
        return cause == null
                ? new RecordClientException(message, failureCategory, provider(options), networkMode(options), httpStatus,
                responseContentType, responseSnippet, networkBlockSuspected)
                : new RecordClientException(message, cause, failureCategory, provider(options), networkMode(options), httpStatus,
                responseContentType, responseSnippet, networkBlockSuspected);
    }

    private static RecordClientException exception(String message,
                                                   Throwable cause,
                                                   String failureCategory,
                                                   Integer httpStatus,
                                                   String responseContentType,
                                                   String responseSnippet,
                                                   RecordClientOptions options,
                                                   boolean networkBlockSuspected) {
        return exception(message, failureCategory, httpStatus, responseContentType, responseSnippet, options, networkBlockSuspected, cause);
    }

    private static String provider(RecordClientOptions options) {
        return options == null || options.getProvider() == null || options.getProvider().isBlank()
                ? null
                : options.getProvider().trim().toLowerCase();
    }

    private static String networkMode(RecordClientOptions options) {
        String value = options == null ? null : options.getNetworkMode();
        if (value == null || value.isBlank()) {
            return RecordClientOptions.NETWORK_MODE_SYSTEM;
        }
        return value.trim().toLowerCase();
    }

    private static int snippetLength(RecordClientOptions options) {
        Integer configuredLength = options == null ? null : options.getDiagnosticSnippetLength();
        return configuredLength == null || configuredLength <= 0 ? 240 : Math.min(configuredLength, 1000);
    }

    private static boolean networkBlockStatus(int httpStatus) {
        return httpStatus == 403 || httpStatus == 407;
    }

    private record HttpResult(String content, Integer httpStatus, String contentType, String snippet) {
    }
}
