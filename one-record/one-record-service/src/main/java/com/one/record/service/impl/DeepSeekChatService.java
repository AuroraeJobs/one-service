package com.one.record.service.impl;

import com.one.record.service.IChatService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DeepSeekChatService implements IChatService {

    @Value("${deepseek.api-key:your-api-key}")
    private String apiKey;

    @Value("${deepseek.base-url:https://api.deepseek.com/v1}")
    private String baseUrl;

    @Value("${deepseek.model:deepseek-chat}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    // 存储会话历史，key为会话ID，value为消息列表
    private final Map<String, List<Map<String, String>>> sessionHistory = new ConcurrentHashMap<>();

    /**
     * 简单聊天，不保存历史记录
     */
    @Override
    public String chat(String prompt) {
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        
        return callDeepSeekApi(messages);
    }

    /**
     * 带会话的聊天，保存历史记录
     */
    @Override
    public String chatWithHistory(String sessionId, String prompt) {
        // 获取或创建会话历史
        List<Map<String, String>> messages = sessionHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());
        
        // 添加用户消息
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        
        // 调用DeepSeek API
        String response = callDeepSeekApi(messages);
        
        // 添加AI响应到历史记录
        Map<String, String> aiMessage = new HashMap<>();
        aiMessage.put("role", "assistant");
        aiMessage.put("content", response);
        messages.add(aiMessage);
        
        // 限制历史记录长度，避免过长
        if (messages.size() > 20) {
            messages = new ArrayList<>(messages.subList(messages.size() - 20, messages.size()));
            sessionHistory.put(sessionId, messages);
        }
        
        return response;
    }

    /**
     * 清空会话历史
     */
    @Override
    public void clearHistory(String sessionId) {
        sessionHistory.remove(sessionId);
    }

    /**
     * 调用DeepSeek API
     */
    private String callDeepSeekApi(List<Map<String, String>> messages) {
        // 构建请求URL
        String url = baseUrl + "/chat/completions";
        
        // 构建请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        
        // 构建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);
        
        // 发送请求
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, requestEntity, Map.class);
        
        // 处理响应
        Map responseBody = responseEntity.getBody();
        if (responseBody != null) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                Map<String, Object> message = (Map<String, Object>) choice.get("message");
                if (message != null) {
                    return (String) message.get("content");
                }
            }
        }
        
        return "Error: No response from DeepSeek API";
    }
}