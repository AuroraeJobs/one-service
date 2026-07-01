package com.one.record.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.ai.AiModelOption;
import com.one.record.service.IAIModelCacheService;
import com.one.record.service.ILocalAIService;
import com.one.record.service.IOpenAIModelService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AIModelCacheService implements IAIModelCacheService {

    private static final String MODELS_ALL_KEY = "ai:models:all";

    private static final String MODELS_PROVIDER_KEY_PREFIX = "ai:models:provider:";

    private static final List<String> PROVIDERS = Arrays.asList("local", "deepseek", "openai");

    private final ILocalAIService localAIService;

    private final IOpenAIModelService openAIModelService;

    private final StringRedisTemplate redisTemplate;

    private final ObjectMapper objectMapper;

    @Value("${localai.model:llama3.1}")
    private String defaultLocalModel;

    @Value("${spring.ai.deepseek.chat.model}")
    private String defaultDeepSeekModel;

    @Value("${spring.ai.openai.chat.options.model}")
    private String defaultOpenAIModel;

    public AIModelCacheService(ILocalAIService localAIService,
                               IOpenAIModelService openAIModelService,
                               StringRedisTemplate redisTemplate,
                               ObjectMapper objectMapper) {
        this.localAIService = localAIService;
        this.openAIModelService = openAIModelService;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<AiModelOption> getModels() {
        List<AiModelOption> cachedModels = readModels(MODELS_ALL_KEY);
        if (!cachedModels.isEmpty()) {
            return cachedModels;
        }

        List<AiModelOption> providerModels = PROVIDERS.stream()
                .flatMap(provider -> readModels(providerKey(provider)).stream())
                .collect(Collectors.toList());
        if (!providerModels.isEmpty()) {
            return providerModels;
        }

        return defaultModels();
    }

    @Override
    public List<AiModelOption> getModelsByProvider(String provider) {
        String normalizedProvider = normalizeProvider(provider);
        List<AiModelOption> cachedModels = readModels(providerKey(normalizedProvider));
        if (!cachedModels.isEmpty()) {
            return cachedModels;
        }

        List<AiModelOption> models = getModels().stream()
                .filter(model -> normalizedProvider.equalsIgnoreCase(model.getProvider()))
                .collect(Collectors.toList());
        if (!models.isEmpty()) {
            return models;
        }

        return Collections.singletonList(defaultModel(normalizedProvider));
    }

    @Override
    public List<AiModelOption> refreshModels() {
        Map<String, List<AiModelOption>> refreshedModelsByProvider = new LinkedHashMap<>();
        for (String provider : PROVIDERS) {
            List<AiModelOption> models = fetchModelsByProvider(provider);
            refreshedModelsByProvider.put(provider, models);
            saveModels(providerKey(provider), models);
        }

        List<AiModelOption> models = refreshedModelsByProvider.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toList());
        saveModels(MODELS_ALL_KEY, models);
        return models;
    }

    @Override
    public List<AiModelOption> refreshModelsByProvider(String provider) {
        String normalizedProvider = normalizeProvider(provider);
        List<AiModelOption> refreshedModels = fetchModelsByProvider(normalizedProvider);
        saveModels(providerKey(normalizedProvider), refreshedModels);

        List<AiModelOption> allModels = new ArrayList<>();
        for (String item : PROVIDERS) {
            if (item.equals(normalizedProvider)) {
                allModels.addAll(refreshedModels);
            } else {
                allModels.addAll(getModelsByProvider(item));
            }
        }
        saveModels(MODELS_ALL_KEY, allModels);
        return refreshedModels;
    }

    private List<AiModelOption> fetchModelsByProvider(String provider) {
        if ("deepseek".equals(provider)) {
            return getRemoteModels("deepseek", defaultDeepSeekModel, openAIModelService.getDeepSeekModels());
        }
        if ("openai".equals(provider)) {
            return getRemoteModels("openai", defaultOpenAIModel, openAIModelService.getOpenAIModels());
        }
        return getLocalModels();
    }

    private List<AiModelOption> getLocalModels() {
        List<AiModelOption> models = new ArrayList<>();
        List<Map<String, Object>> localModels;
        try {
            localModels = localAIService.getModelList();
        } catch (RuntimeException exception) {
            log.warn("刷新本地模型列表失败，使用默认本地模型", exception);
            localModels = new ArrayList<>();
        }

        if (localModels != null) {
            for (Map<String, Object> model : localModels) {
                Object nameValue = model.get("name");
                String name = nameValue == null ? null : String.valueOf(nameValue);
                if (name != null && !name.trim().isEmpty()) {
                    models.add(new AiModelOption("local:" + name, name, "local", name, true, model));
                }
            }
        }

        if (models.isEmpty()) {
            models.add(defaultModel("local"));
        }
        return models;
    }

    private List<AiModelOption> getRemoteModels(String provider, String defaultModel, Map<String, Object> response) {
        List<AiModelOption> models = new ArrayList<>();
        if (response == null) {
            response = new HashMap<>();
        }
        boolean available = Boolean.TRUE.equals(response.get("available"));
        Object dataValue = response.get("data");
        if (dataValue instanceof List<?>) {
            for (Object item : (List<?>) dataValue) {
                if (item instanceof Map<?, ?>) {
                    Map<String, Object> modelDetail = new HashMap<>();
                    for (Map.Entry<?, ?> entry : ((Map<?, ?>) item).entrySet()) {
                        if (entry.getKey() != null) {
                            modelDetail.put(String.valueOf(entry.getKey()), entry.getValue());
                        }
                    }
                    Object idValue = modelDetail.get("id");
                    String model = idValue == null ? null : String.valueOf(idValue);
                    if (model != null && !model.trim().isEmpty()) {
                        models.add(new AiModelOption(provider + ":" + model, provider + " " + model, provider, model, available, modelDetail));
                    }
                }
            }
        }
        if (models.isEmpty()) {
            Map<String, Object> details = new HashMap<>();
            details.putAll(response);
            models.add(new AiModelOption(provider + ":" + defaultModel, provider + " " + defaultModel, provider, defaultModel, available, details));
        }
        return models;
    }

    private List<AiModelOption> defaultModels() {
        return PROVIDERS.stream()
                .map(this::defaultModel)
                .collect(Collectors.toList());
    }

    private AiModelOption defaultModel(String provider) {
        String normalizedProvider = normalizeProvider(provider);
        String model = defaultLocalModel;
        if ("deepseek".equals(normalizedProvider)) {
            model = defaultDeepSeekModel;
        } else if ("openai".equals(normalizedProvider)) {
            model = defaultOpenAIModel;
        }

        return new AiModelOption(
                normalizedProvider + ":" + model,
                "local".equals(normalizedProvider) ? model : normalizedProvider + " " + model,
                normalizedProvider,
                model,
                false,
                new HashMap<>()
        );
    }

    private String normalizeProvider(String provider) {
        if (provider == null || provider.trim().isEmpty()) {
            return "local";
        }
        String normalizedProvider = provider.trim().toLowerCase();
        return PROVIDERS.contains(normalizedProvider) ? normalizedProvider : "local";
    }

    private String providerKey(String provider) {
        return MODELS_PROVIDER_KEY_PREFIX + provider;
    }

    private List<AiModelOption> readModels(String key) {
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value == null || value.trim().isEmpty()) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(value, new TypeReference<List<AiModelOption>>() {
            });
        } catch (JsonProcessingException exception) {
            log.warn("AI 模型列表反序列化失败，key={}", key, exception);
        } catch (RuntimeException exception) {
            log.warn("AI 模型列表读取 Redis 失败，key={}", key, exception);
        }
        return new ArrayList<>();
    }

    private void saveModels(String key, List<AiModelOption> models) {
        try {
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(models));
        } catch (JsonProcessingException exception) {
            log.warn("AI 模型列表序列化失败，key={}", key, exception);
        } catch (RuntimeException exception) {
            log.warn("AI 模型列表写入 Redis 失败，key={}", key, exception);
        }
    }
}
