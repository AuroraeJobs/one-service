package com.one.record.service.impl;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OpenRouterChatService extends AbstractSpringAiChatService {

    @Value("${spring.ai.openrouter.chat.options.model}")
    private String model;

    public OpenRouterChatService(@Qualifier("openRouterChatModel") ChatModel chatModel) {
        super(chatModel, "OpenRouter");
    }

    @Override
    protected String defaultModel() {
        return model;
    }

    @Override
    protected ChatOptions chatOptions(String selectedModel) {
        return OpenAiChatOptions.builder()
                .model(selectedModel)
                .temperature(0.7)
                .maxTokens(1000)
                .build();
    }
}
