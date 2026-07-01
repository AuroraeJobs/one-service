package com.one.record.web;

import com.one.record.ai.AiModelOption;
import com.one.record.service.IAIModelCacheService;
import com.one.record.service.IChatService;
import com.one.record.service.ILocalAIService;
import com.one.record.service.IOpenAIModelService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat/ai")
public class AIChatController {

    @Autowired
    private ILocalAIService localAIService;

    @Autowired
    @Qualifier("deepSeekChatService")
    private IChatService deepSeekChatService;

    @Autowired
    @Qualifier("openAIChatService")
    private IChatService openAIChatService;

    @Autowired
    private IOpenAIModelService openAIModelService;

    @Autowired
    private IAIModelCacheService aiModelCacheService;

    @Value("${localai.model:llama3.1}")
    private String defaultLocalModel;

    @Value("${spring.ai.deepseek.chat.model}")
    private String defaultDeepSeekModel;

    @Value("${spring.ai.openai.chat.options.model}")
    private String defaultOpenAIModel;

    @PostMapping("/completions")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String modelId = normalizeModelId(request.getModel());
        String response = dispatchChat(request.getPrompt(), modelId);
        return new ChatResponse(response, modelId);
    }

    @PostMapping("/completions/{sessionId}")
    public ChatResponse chatWithHistory(@PathVariable("sessionId") String sessionId, @RequestBody ChatRequest request) {
        String modelId = normalizeModelId(request.getModel());
        String response = dispatchChatWithHistory(sessionId, request.getPrompt(), modelId);
        return new ChatResponse(response, modelId);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public void clearHistory(@PathVariable("sessionId") String sessionId) {
        localAIService.clearHistory(sessionId);
        deepSeekChatService.clearHistory(sessionId);
        openAIChatService.clearHistory(sessionId);
    }

    @GetMapping("/models")
    public ModelListResponse getModels() {
        return new ModelListResponse(aiModelCacheService.getModels());
    }

    @GetMapping("/models/{provider}")
    public ModelListResponse getModelsByProvider(@PathVariable("provider") String provider) {
        return new ModelListResponse(aiModelCacheService.getModelsByProvider(provider));
    }

    @PostMapping("/models/refresh")
    public ModelListResponse refreshModels() {
        return new ModelListResponse(aiModelCacheService.refreshModels());
    }

    @PostMapping("/models/{provider}/refresh")
    public ModelListResponse refreshModelsByProvider(@PathVariable("provider") String provider) {
        return new ModelListResponse(aiModelCacheService.refreshModelsByProvider(provider));
    }

    @GetMapping("/openai/models")
    public Map<String, Object> getOpenAIModelRawResponse() {
        return openAIModelService.getOpenAIModels();
    }

    private String dispatchChat(String prompt, String modelId) {
        ModelSelection selection = parseModel(modelId);
        if ("deepseek".equals(selection.getProvider())) {
            return deepSeekChatService.chat(prompt, selection.getModel());
        }
        if ("openai".equals(selection.getProvider())) {
            return openAIChatService.chat(prompt, selection.getModel());
        }
        return localAIService.chat(prompt, selection.getModel());
    }

    private String dispatchChatWithHistory(String sessionId, String prompt, String modelId) {
        ModelSelection selection = parseModel(modelId);
        if ("deepseek".equals(selection.getProvider())) {
            return deepSeekChatService.chatWithHistory(sessionId, prompt, selection.getModel());
        }
        if ("openai".equals(selection.getProvider())) {
            return openAIChatService.chatWithHistory(sessionId, prompt, selection.getModel());
        }
        return localAIService.chatWithHistory(sessionId, prompt, selection.getModel());
    }

    private String normalizeModelId(String modelId) {
        if (modelId == null || modelId.trim().isEmpty()) {
            return defaultModelId("local");
        }
        return modelId.trim();
    }

    private ModelSelection parseModel(String modelId) {
        String normalized = normalizeModelId(modelId);
        int splitIndex = normalized.indexOf(':');
        if (splitIndex <= 0) {
            return new ModelSelection("local", normalized);
        }

        String provider = normalized.substring(0, splitIndex).toLowerCase();
        String model = normalized.substring(splitIndex + 1);
        if (model.trim().isEmpty()) {
            model = defaultModel(provider);
        }
        return new ModelSelection(provider, model);
    }

    private String defaultModelId(String provider) {
        String normalizedProvider = normalizeProvider(provider);
        return aiModelCacheService.getModelsByProvider(normalizedProvider).stream()
                .findFirst()
                .map(AiModelOption::getId)
                .orElse(normalizedProvider + ":" + defaultModel(normalizedProvider));
    }

    private String defaultModel(String provider) {
        String normalizedProvider = normalizeProvider(provider);
        return aiModelCacheService.getModelsByProvider(normalizedProvider).stream()
                .findFirst()
                .map(AiModelOption::getModel)
                .orElseGet(() -> {
                    if ("deepseek".equals(normalizedProvider)) {
                        return defaultDeepSeekModel;
                    }
                    if ("openai".equals(normalizedProvider)) {
                        return defaultOpenAIModel;
                    }
                    return defaultLocalModel;
                });
    }

    private String normalizeProvider(String provider) {
        return provider == null || provider.trim().isEmpty() ? "local" : provider.trim().toLowerCase();
    }

    @Setter
    @Getter
    public static class ChatRequest {
        private String prompt;
        private String model;
    }

    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String response;
        private String model;
    }

    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelListResponse {
        private List<AiModelOption> models;
    }

    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    private static class ModelSelection {
        private String provider;
        private String model;
    }
}
