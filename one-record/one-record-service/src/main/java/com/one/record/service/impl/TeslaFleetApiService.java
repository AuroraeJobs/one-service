package com.one.record.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.common.exception.ServiceException;
import com.one.record.configuration.TeslaFleetProperties;
import com.one.record.service.ITeslaFleetApiService;
import com.one.record.tesla.TeslaFleetApiCache;
import com.one.record.tesla.TeslaFleetChargingHistoryCache;
import com.one.record.tesla.TeslaFleetTokenCache;
import com.one.record.tesla.TeslaFleetTokenRequest;
import com.one.record.tesla.TeslaFleetTokenResponse;
import com.one.record.tesla.TeslaFleetTokenStatus;
import com.one.record.tesla.TeslaFleetTelemetryCache;
import com.one.record.tesla.TeslaFleetVehicleCache;
import org.springframework.core.ParameterizedTypeReference;
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

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class TeslaFleetApiService implements ITeslaFleetApiService {

    private static final String DEFAULT_ACCOUNT_KEY = "default";
    private static final String TOKEN_KEY_PREFIX = "tesla:fleet:token:";
    private static final String VEHICLE_KEY_PREFIX = "tesla:fleet:vehicles:";
    private static final String CHARGING_HISTORY_KEY_PREFIX = "tesla:fleet:charging-history:";
    private static final String API_CACHE_KEY_PREFIX = "tesla:fleet:api:";
    private static final String TELEMETRY_KEY_PREFIX = "tesla:fleet:telemetry:";

    private final TeslaFleetProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    @Override
    public String buildAuthorizeUrl(String state, String nonce, String scope, String redirectUri) {
        requireClientId();
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(properties.getAuthBaseUrl() + "/authorize")
                .queryParam("response_type", "code")
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", valueOrDefault(redirectUri, properties.getRedirectUri()))
                .queryParam("scope", valueOrDefault(scope, properties.getScope()))
                .queryParam("state", valueOrDefault(state, UUID.randomUUID().toString()))
                .queryParam("prompt_missing_scopes", "true")
                .queryParam("require_requested_scopes", "true");

        if (hasText(nonce)) {
            builder.queryParam("nonce", nonce);
        }
        return builder.build().encode().toUriString();
    }

    @Override
    public TeslaFleetTokenResponse exchangeAuthorizationCode(TeslaFleetTokenRequest request) {
        MultiValueMap<String, String> form = baseTokenForm("authorization_code");
        form.add("code", request.getCode());
        form.add("redirect_uri", valueOrDefault(request.getRedirectUri(), properties.getRedirectUri()));
        if (hasText(request.getScope())) {
            form.add("scope", request.getScope());
        }
        return token(form);
    }

    @Override
    public TeslaFleetTokenResponse refreshToken(TeslaFleetTokenRequest request) {
        requireClientId();
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("client_id", properties.getClientId());
        form.add("refresh_token", request.getRefreshToken());
        return token(form);
    }

    @Override
    public TeslaFleetTokenResponse saveToken(String accountKey, TeslaFleetTokenResponse token) {
        if (token == null) {
            throw new ServiceException("Tesla token 响应为空");
        }
        TeslaFleetTokenCache cached = getTokenCache(accountKey);
        TeslaFleetTokenResponse existing = cached == null ? null : cached.getToken();
        if (existing != null) {
            if (!hasText(token.getAccessToken())) {
                token.setAccessToken(existing.getAccessToken());
            }
            if (!hasText(token.getRefreshToken())) {
                token.setRefreshToken(existing.getRefreshToken());
            }
            if (!hasText(token.getIdToken())) {
                token.setIdToken(existing.getIdToken());
            }
            if (!hasText(token.getTokenType())) {
                token.setTokenType(existing.getTokenType());
            }
            if (!hasText(token.getScope())) {
                token.setScope(existing.getScope());
            }
            if (token.getExpiresIn() == null) {
                token.setExpiresIn(existing.getExpiresIn());
            }
        }
        saveTokenCache(accountKey, token, null);
        return token;
    }

    @Override
    public TeslaFleetTokenResponse exchangeAuthorizationCodeAndStore(String accountKey, TeslaFleetTokenRequest request) {
        TeslaFleetTokenResponse response = exchangeAuthorizationCode(request);
        saveToken(accountKey, response, null);
        return response;
    }

    @Override
    public TeslaFleetTokenResponse refreshStoredToken(String accountKey) {
        TeslaFleetTokenCache cached = getTokenCache(accountKey);
        if (cached == null || cached.getToken() == null || !hasText(cached.getToken().getRefreshToken())) {
            throw new ServiceException("Redis 中不存在 Tesla refresh_token，请先完成授权");
        }

        TeslaFleetTokenRequest request = new TeslaFleetTokenRequest();
        request.setRefreshToken(cached.getToken().getRefreshToken());
        TeslaFleetTokenResponse response = refreshToken(request);
        saveToken(accountKey, response, cached.getToken().getRefreshToken());
        return response;
    }

    @Override
    public TeslaFleetTokenStatus getTokenStatus(String accountKey) {
        String normalizedAccountKey = accountKey(accountKey);
        TeslaFleetTokenCache cached = getTokenCache(normalizedAccountKey);
        TeslaFleetTokenStatus status = new TeslaFleetTokenStatus();
        status.setAccountKey(normalizedAccountKey);
        if (cached == null || cached.getToken() == null) {
            return status;
        }

        TeslaFleetTokenResponse token = cached.getToken();
        status.setHasAccessToken(hasText(token.getAccessToken()));
        status.setHasRefreshToken(hasText(token.getRefreshToken()));
        status.setExpiresAt(cached.getExpiresAt());
        status.setUpdatedAt(cached.getUpdatedAt());
        status.setTokenType(token.getTokenType());
        status.setScope(token.getScope());
        return status;
    }

    @Override
    public TeslaFleetTokenCache getStoredToken(String accountKey) {
        return getTokenCache(accountKey(accountKey));
    }

    @Override
    public TeslaFleetTokenResponse partnerToken(String scope) {
        MultiValueMap<String, String> form = baseTokenForm("client_credentials");
        form.add("scope", valueOrDefault(scope, properties.getPartnerScope()));
        return token(form);
    }

    @Override
    public Map<String, Object> listVehicles(String accessToken) {
        return get(accessToken, "/api/1/vehicles");
    }

    @Override
    public Map<String, Object> chargingHistory(String accessToken, Map<String, String> query) {
        return get(accessToken, buildPath("/api/1/dx/charging/history", query));
    }

    @Override
    public Map<String, Object> chargingInvoice(String accessToken, String invoiceId) {
        return get(accessToken, "/api/1/dx/charging/invoice/" + invoiceId);
    }

    @Override
    public Map<String, Object> userMe(String accessToken) {
        return get(accessToken, "/api/1/users/me");
    }

    @Override
    public Map<String, Object> userMeWithStoredToken(String accountKey) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return userMe(token.getAccessToken());
    }

    @Override
    public TeslaFleetApiCache getApiCache(String accountKey, String type, String key) {
        String value = redisTemplate.opsForValue().get(apiCacheKey(accountKey, type, key));
        if (!hasText(value)) {
            return null;
        }
        try {
            return objectMapper.readValue(value, TeslaFleetApiCache.class);
        } catch (Exception e) {
            throw new ServiceException("Tesla API 缓存读取失败: {}", e.getMessage());
        }
    }

    @Override
    public TeslaFleetApiCache refreshUserMeCache(String accountKey) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return saveApiCache(accountKey, "user-me", "current", userMe(token.getAccessToken()));
    }

    @Override
    public TeslaFleetApiCache refreshUserRegionCache(String accountKey) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return saveApiCache(accountKey, "user-region", "current", userRegion(token.getAccessToken()));
    }

    @Override
    public TeslaFleetApiCache refreshVehicleCache(String accountKey, String vin) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return saveApiCache(accountKey, "vehicle", vin, getVehicle(token.getAccessToken(), vin));
    }

    @Override
    public TeslaFleetApiCache refreshVehicleDataCache(String accountKey, String vin) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return saveApiCache(accountKey, "vehicle-data", vin, getVehicleData(token.getAccessToken(), vin));
    }

    @Override
    public TeslaFleetApiCache refreshNearbyChargingSitesCache(String accountKey, String vin) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return saveApiCache(accountKey, "nearby-charging-sites", vin, nearbyChargingSites(token.getAccessToken(), vin));
    }

    @Override
    public TeslaFleetApiCache refreshChargingInvoiceCache(String accountKey, String invoiceId) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return saveApiCache(accountKey, "charging-invoice", invoiceId, chargingInvoice(token.getAccessToken(), invoiceId));
    }

    @Override
    public TeslaFleetVehicleCache getCachedVehicles(String accountKey) {
        String value = redisTemplate.opsForValue().get(vehicleKey(accountKey));
        if (!hasText(value)) {
            return null;
        }
        try {
            return objectMapper.readValue(value, TeslaFleetVehicleCache.class);
        } catch (Exception e) {
            throw new ServiceException("Tesla 车辆缓存读取失败: {}", e.getMessage());
        }
    }

    @Override
    public TeslaFleetVehicleCache refreshCachedVehicles(String accountKey) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        Map<String, Object> vehicles = listVehicles(token.getAccessToken());
        TeslaFleetVehicleCache cache = new TeslaFleetVehicleCache();
        cache.setVehicles(vehicles);
        cache.setUpdatedAt(now());
        saveJson(vehicleKey(accountKey), cache);
        return cache;
    }

    @Override
    public TeslaFleetChargingHistoryCache getCachedChargingHistory(String accountKey) {
        String value = redisTemplate.opsForValue().get(chargingHistoryKey(accountKey));
        if (!hasText(value)) {
            return null;
        }
        try {
            return objectMapper.readValue(value, TeslaFleetChargingHistoryCache.class);
        } catch (Exception e) {
            throw new ServiceException("Tesla 充电记录缓存读取失败: {}", e.getMessage());
        }
    }

    @Override
    public TeslaFleetChargingHistoryCache refreshCachedChargingHistory(String accountKey, Map<String, String> query) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        Map<String, Object> history = chargingHistory(token.getAccessToken(), query);
        TeslaFleetChargingHistoryCache cache = new TeslaFleetChargingHistoryCache();
        cache.setChargingHistory(history);
        cache.setUpdatedAt(now());
        saveJson(chargingHistoryKey(accountKey), cache);
        return cache;
    }

    @Override
    public Map<String, Object> getVehicle(String accessToken, String vin) {
        return get(accessToken, "/api/1/vehicles/" + vin);
    }

    @Override
    public Map<String, Object> getVehicleData(String accessToken, String vin) {
        return get(accessToken, "/api/1/vehicles/" + vin + "/vehicle_data");
    }

    @Override
    public Map<String, Object> wakeUp(String accessToken, String vin) {
        return post(accessToken, "/api/1/vehicles/" + vin + "/wake_up", Collections.emptyMap());
    }

    @Override
    public Map<String, Object> vehicleCommand(String accessToken, String vin, String command, Map<String, Object> body) {
        String path = "/api/1/vehicles/" + vin + "/command/" + command;
        Object requestBody = body == null ? Collections.emptyMap() : body;
        String commandProxyBaseUrl = commandProxyBaseUrl();
        if (hasText(commandProxyBaseUrl)) {
            return exchange(accessToken, HttpMethod.POST, commandProxyBaseUrl, path, requestBody);
        }
        return post(accessToken, path, requestBody);
    }

    @Override
    public Map<String, Object> vehicleCommandWithStoredToken(String accountKey, String vin, String command, Map<String, Object> body) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return vehicleCommand(token.getAccessToken(), vin, command, body);
    }

    @Override
    public Map<String, Object> createFleetTelemetryConfigWithStoredToken(String accountKey, Map<String, Object> body) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return commandCapablePost(token.getAccessToken(), "/api/1/vehicles/fleet_telemetry_config", body == null ? Collections.emptyMap() : body);
    }

    @Override
    public Map<String, Object> getFleetTelemetryConfigWithStoredToken(String accountKey, String vin) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return get(token.getAccessToken(), "/api/1/vehicles/" + vin + "/fleet_telemetry_config");
    }

    @Override
    public Map<String, Object> deleteFleetTelemetryConfigWithStoredToken(String accountKey, String vin) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return exchange(token.getAccessToken(), HttpMethod.DELETE, "/api/1/vehicles/" + vin + "/fleet_telemetry_config", null);
    }

    @Override
    public Map<String, Object> fleetTelemetryErrorsWithStoredToken(String accountKey, String vin) {
        TeslaFleetTokenResponse token = usableStoredToken(accountKey);
        return get(token.getAccessToken(), "/api/1/vehicles/" + vin + "/fleet_telemetry_errors");
    }

    @Override
    public TeslaFleetTelemetryCache getFleetTelemetryCache(String vin, String recordType) {
        String value = redisTemplate.opsForValue().get(telemetryKey(vin, recordType));
        if (!hasText(value)) {
            return null;
        }
        try {
            return objectMapper.readValue(value, TeslaFleetTelemetryCache.class);
        } catch (Exception e) {
            throw new ServiceException("Tesla 遥测缓存读取失败: {}", e.getMessage());
        }
    }

    @Override
    public Map<String, Object> nearbyChargingSites(String accessToken, String vin) {
        return get(accessToken, "/api/1/vehicles/" + vin + "/nearby_charging_sites");
    }

    @Override
    public Map<String, Object> userRegion(String accessToken) {
        return get(accessToken, "/api/1/users/region");
    }

    @Override
    public Map<String, Object> registerPartnerAccount(String partnerToken, String domain) {
        Map<String, String> body = new HashMap<>();
        body.put("domain", domain);
        return post(partnerToken, "/api/1/partner_accounts", body);
    }

    @Override
    public Map<String, Object> getPartnerPublicKey(String partnerToken, String domain) {
        String path = UriComponentsBuilder.fromPath("/api/1/partner_accounts/public_key")
                .queryParam("domain", domain)
                .build()
                .encode()
                .toUriString();
        return get(partnerToken, path);
    }

    private TeslaFleetTokenResponse usableStoredToken(String accountKey) {
        TeslaFleetTokenCache cached = getTokenCache(accountKey);
        if (cached == null || cached.getToken() == null) {
            throw new ServiceException("Redis 中不存在 Tesla token，请先完成授权");
        }

        if (cached.getExpiresAt() != null && cached.getExpiresAt() <= now() + 60000) {
            return refreshStoredToken(accountKey);
        }

        if (!hasText(cached.getToken().getAccessToken())) {
            throw new ServiceException("Redis 中不存在 Tesla access_token，请先刷新或重新授权");
        }
        return cached.getToken();
    }

    private void saveToken(String accountKey, TeslaFleetTokenResponse response, String fallbackRefreshToken) {
        if (response == null) {
            throw new ServiceException("Tesla token 响应为空");
        }
        if (!hasText(response.getRefreshToken()) && hasText(fallbackRefreshToken)) {
            response.setRefreshToken(fallbackRefreshToken);
        }

        Long current = now();
        TeslaFleetTokenCache cache = new TeslaFleetTokenCache();
        cache.setToken(response);
        cache.setUpdatedAt(current);
        if (response.getExpiresIn() != null) {
            cache.setExpiresAt(current + response.getExpiresIn() * 1000);
        }
        saveJson(tokenKey(accountKey), cache);
    }

    private void saveTokenCache(String accountKey, TeslaFleetTokenResponse response, String fallbackRefreshToken) {
        saveToken(accountKey, response, fallbackRefreshToken);
    }

    private TeslaFleetTokenCache getTokenCache(String accountKey) {
        String value = redisTemplate.opsForValue().get(tokenKey(accountKey));
        if (!hasText(value)) {
            return null;
        }
        try {
            return objectMapper.readValue(value, TeslaFleetTokenCache.class);
        } catch (Exception e) {
            throw new ServiceException("Tesla token 缓存读取失败: {}", e.getMessage());
        }
    }

    private void saveJson(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value));
        } catch (Exception e) {
            throw new ServiceException("Tesla Redis 缓存写入失败: {}", e.getMessage());
        }
    }

    private TeslaFleetApiCache saveApiCache(String accountKey, String type, String key, Map<String, Object> data) {
        if (!hasText(key)) {
            throw new ServiceException("Tesla API 缓存 key 不能为空");
        }
        TeslaFleetApiCache cache = new TeslaFleetApiCache();
        cache.setType(type);
        cache.setKey(key);
        cache.setData(data);
        cache.setUpdatedAt(now());
        saveJson(apiCacheKey(accountKey, type, key), cache);
        return cache;
    }

    private String tokenKey(String accountKey) {
        return TOKEN_KEY_PREFIX + accountKey(accountKey);
    }

    private String vehicleKey(String accountKey) {
        return VEHICLE_KEY_PREFIX + accountKey(accountKey);
    }

    private String chargingHistoryKey(String accountKey) {
        return CHARGING_HISTORY_KEY_PREFIX + accountKey(accountKey);
    }

    private String apiCacheKey(String accountKey, String type, String key) {
        return API_CACHE_KEY_PREFIX + accountKey(accountKey) + ":" + type + ":" + key;
    }

    private String telemetryKey(String vin, String recordType) {
        return TELEMETRY_KEY_PREFIX + vin + ":" + valueOrDefault(recordType, "V");
    }

    private String accountKey(String accountKey) {
        return hasText(accountKey) ? accountKey.trim() : DEFAULT_ACCOUNT_KEY;
    }

    private long now() {
        return System.currentTimeMillis();
    }

    private TeslaFleetTokenResponse token(MultiValueMap<String, String> form) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        try {
            ResponseEntity<TeslaFleetTokenResponse> response = restTemplate.exchange(
                    properties.getAuthBaseUrl() + "/token",
                    HttpMethod.POST,
                    new HttpEntity<>(form, headers),
                    TeslaFleetTokenResponse.class
            );
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            throw teslaException("Tesla token request failed", e);
        }
    }

    private MultiValueMap<String, String> baseTokenForm(String grantType) {
        requireClientId();
        requireClientSecret();
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", grantType);
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        form.add("audience", properties.getApiBaseUrl());
        return form;
    }

    private Map<String, Object> get(String accessToken, String path) {
        return exchange(accessToken, HttpMethod.GET, path, null);
    }

    private Map<String, Object> post(String accessToken, String path, Object body) {
        return exchange(accessToken, HttpMethod.POST, path, body);
    }

    private Map<String, Object> commandCapablePost(String accessToken, String path, Object body) {
        String commandProxyBaseUrl = commandProxyBaseUrl();
        if (hasText(commandProxyBaseUrl)) {
            return exchange(accessToken, HttpMethod.POST, commandProxyBaseUrl, path, body);
        }
        return post(accessToken, path, body);
    }

    private String buildPath(String path, Map<String, String> query) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromPath(path);
        if (query != null) {
            query.forEach((key, value) -> {
                if (hasText(key) && hasText(value) && !"accountKey".equals(key)) {
                    builder.queryParam(key, value);
                }
            });
        }
        return builder.build().encode().toUriString();
    }

    private Map<String, Object> exchange(String accessToken, HttpMethod method, String path, Object body) {
        return exchange(accessToken, method, properties.getApiBaseUrl(), path, body);
    }

    private Map<String, Object> exchange(String accessToken, HttpMethod method, String baseUrl, String path, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        if (body != null) {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    baseUrl + path,
                    method,
                    new HttpEntity<>(body, headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    }
            );
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            throw teslaException("Tesla Fleet API request failed", e);
        }
    }

    private String trimTrailingSlash(String value) {
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String commandProxyBaseUrl() {
        if (hasText(properties.getCommandProxyBaseUrl())) {
            return trimTrailingSlash(properties.getCommandProxyBaseUrl());
        }
        if (Boolean.TRUE.equals(properties.getCommandSdkEnabled())) {
            String clientHost = hasText(properties.getCommandSdkClientHost())
                    ? properties.getCommandSdkClientHost().trim()
                    : "127.0.0.1";
            Integer port = properties.getCommandSdkPort() == null ? 4443 : properties.getCommandSdkPort();
            return "https://" + clientHost + ":" + port;
        }
        return "";
    }

    private ServiceException teslaException(String prefix, HttpStatusCodeException e) {
        String detail = e.getResponseBodyAsString();
        try {
            Map<String, Object> error = objectMapper.readValue(detail, new TypeReference<Map<String, Object>>() {
            });
            detail = String.valueOf(error);
        } catch (Exception ignored) {
            log.debug("Tesla error response is not JSON: {}", detail);
        }
        return new ServiceException("{}: status={}, body={}", prefix, e.getStatusCode(), detail);
    }

    private void requireClientId() {
        if (!hasText(properties.getClientId())) {
            throw new ServiceException("缺少 Tesla Fleet API client_id，请配置 tesla.fleet.client-id");
        }
    }

    private void requireClientSecret() {
        if (!hasText(properties.getClientSecret())) {
            throw new ServiceException("缺少 Tesla Fleet API client_secret，请配置 tesla.fleet.client-secret");
        }
    }

    private String valueOrDefault(String value, String defaultValue) {
        return hasText(value) ? value : defaultValue;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
