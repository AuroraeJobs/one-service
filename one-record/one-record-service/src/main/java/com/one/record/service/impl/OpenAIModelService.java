package com.one.record.service.impl;

import com.one.record.service.IOpenAIModelService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class OpenAIModelService implements IOpenAIModelService {

    private final RestClient restClient;
    private final String openAIApiKey;
    private final String openAIBaseUrl;
    private final String deepSeekApiKey;
    private final String deepSeekBaseUrl;
    private final String openRouterApiKey;
    private final String openRouterBaseUrl;

    public OpenAIModelService(
            @Value("${spring.ai.openai.api-key:}") String openAIApiKey,
            @Value("${spring.ai.openai.base-url:https://api.openai.com/v1}") String openAIBaseUrl,
            @Value("${spring.ai.deepseek.api-key:}") String deepSeekApiKey,
            @Value("${spring.ai.deepseek.base-url:https://api.deepseek.com}") String deepSeekBaseUrl,
            @Value("${spring.ai.openrouter.api-key:}") String openRouterApiKey,
            @Value("${spring.ai.openrouter.base-url:https://openrouter.ai/api/v1}") String openRouterBaseUrl) {
        this.restClient = RestClient.builder().build();
        this.openAIApiKey = openAIApiKey;
        this.openAIBaseUrl = openAIBaseUrl;
        this.deepSeekApiKey = deepSeekApiKey;
        this.deepSeekBaseUrl = deepSeekBaseUrl;
        this.openRouterApiKey = openRouterApiKey;
        this.openRouterBaseUrl = openRouterBaseUrl;
    }

    @Override
    public Map<String, Object> getOpenAIModels() {
        return getModels("openai", openAIApiKey, openAIBaseUrl, "OPENAI_API_KEY 未配置，无法获取 OpenAI 模型列表");
    }

    @Override
    public Map<String, Object> getDeepSeekModels() {
        return getModels("deepseek", deepSeekApiKey, deepSeekBaseUrl, "DEEPSEEK_API_KEY 未配置，无法获取 DeepSeek 模型列表");
    }

    @Override
    public Map<String, Object> getOpenRouterModels() {
        return getModels("openrouter", openRouterApiKey, openRouterBaseUrl, "OPENROUTER_API_KEY 未配置，无法获取 OpenRouter 模型列表");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getModels(String provider, String apiKey, String baseUrl, String missingApiKeyMessage) {
        if (apiKey == null || apiKey.trim().isEmpty() || "your-api-key".equals(apiKey.trim())) {
            return errorResponse(provider, null, missingApiKeyMessage, null);
        }

        try {
            Map<String, Object> response = restClient.get()
                    .uri(modelListUrl(baseUrl))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey.trim())
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("available", true);
            result.put("provider", provider);
            if (response != null) {
                result.putAll(response);
            } else {
                result.put("object", "list");
                result.put("data", Collections.emptyList());
            }
            return result;
        } catch (RestClientResponseException exception) {
            return errorResponse(provider, exception.getStatusCode(), exception.getResponseBodyAsString(), exception);
        } catch (RestClientException exception) {
            return errorResponse(provider, null, exception.getMessage(), exception);
        }
    }

    private String modelListUrl(String baseUrl) {
        String normalizedBaseUrl = baseUrl == null ? "https://api.openai.com/v1" : baseUrl.trim();
        while (normalizedBaseUrl.endsWith("/")) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1);
        }
        return normalizedBaseUrl + "/models";
    }

    private Map<String, Object> errorResponse(String provider, HttpStatusCode statusCode, String message, Exception exception) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("available", false);
        result.put("provider", provider);
        result.put("object", "list");
        result.put("data", Collections.emptyList());
        if (statusCode != null) {
            result.put("status", statusCode.value());
        }
        result.put("message", message == null || message.trim().isEmpty() ? "获取 " + provider + " 模型列表失败" : message);
        if (exception != null) {
            result.put("error", exception.getClass().getSimpleName());
        }
        return result;
    }
}
