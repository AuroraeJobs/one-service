package com.one.record.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.configuration.GitHubOAuthProperties;
import com.one.record.enums.ThirdPartyProvider;
import com.one.record.github.GitHubOAuthRequest;
import com.one.record.model.ThirdPartyUserBinding;
import com.one.record.repository.ThirdPartyUserBindingRepository;
import com.one.record.service.IThirdPartyUserBindingService;
import org.springframework.core.ParameterizedTypeReference;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class ThirdPartyUserBindingService implements IThirdPartyUserBindingService {

    private final ThirdPartyUserBindingRepository repository;
    private final GitHubOAuthProperties gitHubOAuthProperties;
    private final RestTemplate restTemplate;

    @Override
    public ThirdPartyUserBinding saveOrUpdate(ThirdPartyUserBinding binding) {
        validate(binding);
        LocalDateTime now = LocalDateTime.now();
        ThirdPartyUserBinding target = repository
                .findByProviderAndThirdPartyUserId(binding.getProvider(), binding.getThirdPartyUserId())
                .orElseGet(() -> {
                    binding.setCreatedAt(now);
                    return binding;
                });

        target.setProvider(binding.getProvider());
        target.setThirdPartyUserId(binding.getThirdPartyUserId());
        target.setLocalUserId(binding.getLocalUserId());
        target.setLocalUsername(binding.getLocalUsername());
        target.setUsername(binding.getUsername());
        target.setNickname(binding.getNickname());
        target.setAvatarUrl(binding.getAvatarUrl());
        target.setEmail(binding.getEmail());
        target.setAccountKey(binding.getAccountKey());
        target.setUnionId(binding.getUnionId());
        target.setRawProfile(binding.getRawProfile());
        target.setUpdatedAt(now);
        return repository.save(target);
    }

    @Override
    public String buildGitHubAuthorizeUrl(String state, String scope, String redirectUri) {
        requireGitHubClientId();
        return UriComponentsBuilder
                .fromUriString(gitHubOAuthProperties.getAuthBaseUrl() + "/authorize")
                .queryParam("client_id", gitHubOAuthProperties.getClientId())
                .queryParam("redirect_uri", valueOrDefault(redirectUri, gitHubOAuthProperties.getRedirectUri()))
                .queryParam("scope", valueOrDefault(scope, gitHubOAuthProperties.getScope()))
                .queryParam("state", valueOrDefault(state, "GitHub:" + UUID.randomUUID()))
                .build()
                .encode()
                .toUriString();
    }

    @Override
    public ThirdPartyUserBinding bindGitHubUser(GitHubOAuthRequest request) {
        if (request == null || isBlank(request.getCode())) {
            throw new ServiceException("GitHub 授权 code 不能为空");
        }
        requireGitHubClientId();
        requireGitHubClientSecret();

        String accessToken = exchangeGitHubAccessToken(request);
        Map<String, Object> profile = getGitHubProfile(accessToken);
        String thirdPartyUserId = valueAsString(profile, "id");
        if (isBlank(thirdPartyUserId)) {
            throw new ServiceException("GitHub 用户信息缺少 id");
        }

        String email = valueAsString(profile, "email");
        if (isBlank(email)) {
            email = getPrimaryGitHubEmail(accessToken);
        }

        ThirdPartyUserBinding binding = ThirdPartyUserBinding.builder()
                .provider(ThirdPartyProvider.GitHub)
                .thirdPartyUserId(thirdPartyUserId)
                .localUserId(request.getLocalUserId())
                .localUsername(request.getLocalUsername())
                .username(valueAsString(profile, "login"))
                .nickname(valueAsString(profile, "name"))
                .avatarUrl(valueAsString(profile, "avatar_url"))
                .email(email)
                .accountKey(valueOrDefault(request.getState(), "GitHub:" + valueOrDefault(request.getLocalUserId(), request.getLocalUsername())))
                .rawProfile(profile)
                .build();
        return saveOrUpdate(binding);
    }

    @Override
    public ThirdPartyUserBinding update(ThirdPartyUserBinding binding) {
        if (binding.getId() == null || binding.getId().trim().isEmpty()) {
            throw new ServiceException("第三方用户绑定 id 不能为空");
        }
        ThirdPartyUserBinding existing = repository.findById(binding.getId())
                .orElseThrow(() -> new NotFoundException("第三方用户绑定不存在: " + binding.getId()));

        existing.setUsername(binding.getUsername());
        existing.setLocalUserId(binding.getLocalUserId());
        existing.setLocalUsername(binding.getLocalUsername());
        existing.setNickname(binding.getNickname());
        existing.setAvatarUrl(binding.getAvatarUrl());
        existing.setEmail(binding.getEmail());
        existing.setAccountKey(binding.getAccountKey());
        existing.setUnionId(binding.getUnionId());
        existing.setRawProfile(binding.getRawProfile());
        existing.setUpdatedAt(LocalDateTime.now());
        return repository.save(existing);
    }

    @Override
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("第三方用户绑定不存在: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    public ThirdPartyUserBinding findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("第三方用户绑定不存在: " + id));
    }

    @Override
    public ThirdPartyUserBinding findByProviderAndThirdPartyUserId(ThirdPartyProvider provider, String thirdPartyUserId) {
        return repository.findByProviderAndThirdPartyUserId(provider, thirdPartyUserId)
                .orElseThrow(() -> new NotFoundException("第三方用户绑定不存在: " + provider + "/" + thirdPartyUserId));
    }

    @Override
    public List<ThirdPartyUserBinding> findAll() {
        return repository.findAllByOrderByUpdatedAtDesc();
    }

    @Override
    public List<ThirdPartyUserBinding> findByProvider(ThirdPartyProvider provider) {
        return repository.findByProvider(provider);
    }

    @Override
    public List<ThirdPartyUserBinding> findByAccountKey(String accountKey) {
        return repository.findByAccountKey(accountKey);
    }

    @Override
    public List<ThirdPartyUserBinding> findByLocalUserId(String localUserId) {
        return repository.findByLocalUserId(localUserId);
    }

    private void validate(ThirdPartyUserBinding binding) {
        if (binding == null) {
            throw new ServiceException("第三方用户绑定不能为空");
        }
        if (binding.getProvider() == null) {
            throw new ServiceException("第三方类型 provider 不能为空");
        }
        if (isBlank(binding.getThirdPartyUserId())) {
            throw new ServiceException("第三方用户 id 不能为空");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String exchangeGitHubAccessToken(GitHubOAuthRequest request) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", gitHubOAuthProperties.getClientId());
        form.add("client_secret", gitHubOAuthProperties.getClientSecret());
        form.add("code", request.getCode());
        String redirectUri = valueOrDefault(request.getRedirectUri(), gitHubOAuthProperties.getRedirectUri());
        if (!isBlank(redirectUri)) {
            form.add("redirect_uri", redirectUri);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    gitHubOAuthProperties.getAuthBaseUrl() + "/access_token",
                    HttpMethod.POST,
                    new HttpEntity<>(form, headers),
                    new ParameterizedTypeReference<>() {
                    }
            );
            Map<String, Object> body = response.getBody();
            String accessToken = valueAsString(body, "access_token");
            if (isBlank(accessToken)) {
                throw new ServiceException("GitHub access_token 获取失败: " + body);
            }
            return accessToken;
        } catch (HttpStatusCodeException e) {
            throw new ServiceException("GitHub access_token 获取失败: " + e.getResponseBodyAsString());
        }
    }

    private Map<String, Object> getGitHubProfile(String accessToken) {
        HttpHeaders headers = gitHubHeaders(accessToken);
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    gitHubOAuthProperties.getApiBaseUrl() + "/user",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {
                    }
            );
            return response.getBody() == null ? new HashMap<>() : response.getBody();
        } catch (HttpStatusCodeException e) {
            throw new ServiceException("GitHub 用户信息获取失败: " + e.getResponseBodyAsString());
        }
    }

    private String getPrimaryGitHubEmail(String accessToken) {
        HttpHeaders headers = gitHubHeaders(accessToken);
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    gitHubOAuthProperties.getApiBaseUrl() + "/user/emails",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {
                    }
            );
            List<Map<String, Object>> emails = response.getBody();
            if (emails == null || emails.isEmpty()) return null;
            return emails.stream()
                    .filter(item -> Boolean.TRUE.equals(item.get("primary")))
                    .map(item -> valueAsString(item, "email"))
                    .filter(email -> !isBlank(email))
                    .findFirst()
                    .orElseGet(() -> valueAsString(emails.getFirst(), "email"));
        } catch (HttpStatusCodeException e) {
            log.warn("GitHub 用户邮箱获取失败: {}", e.getResponseBodyAsString());
            return null;
        }
    }

    private HttpHeaders gitHubHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    private String valueAsString(Map<String, Object> data, String key) {
        if (data == null || !data.containsKey(key)) return null;
        Object value = data.get(key);
        if (value == null) return null;
        if (value instanceof String text) return text;
        return String.valueOf(value);
    }

    private String valueOrDefault(String value, String defaultValue) {
        return isBlank(value) ? defaultValue : value;
    }

    private void requireGitHubClientId() {
        if (isBlank(gitHubOAuthProperties.getClientId())) {
            throw new ServiceException("GitHub OAuth clientId 未配置");
        }
    }

    private void requireGitHubClientSecret() {
        if (isBlank(gitHubOAuthProperties.getClientSecret())) {
            throw new ServiceException("GitHub OAuth clientSecret 未配置");
        }
    }
}
