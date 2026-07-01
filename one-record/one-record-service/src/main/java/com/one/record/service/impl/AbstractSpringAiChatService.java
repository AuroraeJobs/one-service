package com.one.record.service.impl;

import com.one.record.service.IChatService;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public abstract class AbstractSpringAiChatService implements IChatService {

    private final ChatModel chatModel;
    private final String providerName;
    private final Map<String, List<Map<String, String>>> sessionHistory = new ConcurrentHashMap<>();

    protected AbstractSpringAiChatService(ChatModel chatModel, String providerName) {
        this.chatModel = chatModel;
        this.providerName = providerName;
    }

    @Override
    public String chat(String prompt) {
        return chat(prompt, defaultModel());
    }

    @Override
    public String chat(String prompt, String model) {
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        return callApi(messages, model);
    }

    @Override
    public String chatWithHistory(String sessionId, String prompt) {
        return chatWithHistory(sessionId, prompt, defaultModel());
    }

    @Override
    public String chatWithHistory(String sessionId, String prompt, String model) {
        List<Map<String, String>> messages = sessionHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());

        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);

        String response = callApi(messages, model);

        Map<String, String> aiMessage = new HashMap<>();
        aiMessage.put("role", "assistant");
        aiMessage.put("content", response);
        messages.add(aiMessage);

        if (messages.size() > 20) {
            messages = new ArrayList<>(messages.subList(messages.size() - 20, messages.size()));
            sessionHistory.put(sessionId, messages);
        }

        return response;
    }

    @Override
    public void clearHistory(String sessionId) {
        sessionHistory.remove(sessionId);
    }

    protected abstract String defaultModel();

    private String callApi(List<Map<String, String>> messages, String selectedModel) {
        ChatOptions options = chatOptions(resolveModel(selectedModel));
        ChatResponse response = chatModel.call(new Prompt(toSpringAiMessages(messages), options));
        if (response != null && response.getResult() != null && response.getResult().getOutput() != null) {
            return response.getResult().getOutput().getText();
        }
        return "Error: No response from " + providerName + " API";
    }

    private List<Message> toSpringAiMessages(List<Map<String, String>> messages) {
        List<Message> aiMessages = new ArrayList<>();
        for (Map<String, String> message : messages) {
            String role = message.get("role");
            String content = message.get("content");
            if ("assistant".equals(role)) {
                aiMessages.add(new AssistantMessage(content));
            } else {
                aiMessages.add(new UserMessage(content));
            }
        }
        return aiMessages;
    }

    private String resolveModel(String selectedModel) {
        return selectedModel == null || selectedModel.trim().isEmpty() ? defaultModel() : selectedModel.trim();
    }

    protected abstract ChatOptions chatOptions(String selectedModel);
}
