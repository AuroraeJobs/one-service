package com.one.record.service.impl;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.deepseek.DeepSeekChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DeepSeekChatService extends AbstractSpringAiChatService {

    @Value("${spring.ai.deepseek.chat.model}")
    private String model;

    public DeepSeekChatService(@Qualifier("deepSeekChatModel") ChatModel chatModel) {
        super(chatModel, "DeepSeek");
    }

    @Override
    protected String defaultModel() {
        return model;
    }

    @Override
    protected ChatOptions chatOptions(String selectedModel) {
        return DeepSeekChatOptions.builder()
                .temperature(0.7)
                .maxTokens(1000)
                .build();
    }
}
