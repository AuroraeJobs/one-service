package com.one.record.service.impl;

import com.one.record.service.ILocalAIService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LocalAIService implements ILocalAIService {

    @Value("${localai.base-url:http://127.0.0.1:11434/v1}")
    private String baseUrl;

    @Value("${localai.model:llama3.1}")
    private String model;

    @Value("${localai.temperature:0.7}")
    private double temperature;

    @Value("${localai.max-tokens:512}")
    private int maxTokens;

    private final RestTemplate restTemplate;
    
    public LocalAIService() {
        // 配置RestTemplate超时时间为3分钟
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(180000); // 连接超时3分钟
        factory.setReadTimeout(180000);    // 读取超时3分钟
        this.restTemplate = new RestTemplate(factory);
    }

    // 存储会话历史，key为会话ID，value为消息列表
    private final Map<String, List<Map<String, String>>> sessionHistory = new ConcurrentHashMap<>();

    /**
     * 简单聊天，不保存历史记录
     */
    @Override
    public String chat(String content) {
        return chat(content, model);
    }

    /**
     * 简单聊天，不保存历史记录，使用指定模型
     */
    @Override
    public String chat(String content, String model) {
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", content);
        messages.add(userMessage);
        
        return callLocalAIApi(messages, model);
    }

    /**
     * 带会话的聊天，保存历史记录
     */
    @Override
    public String chatWithHistory(String sessionId, String content) {
        return chatWithHistory(sessionId, content, model);
    }

    /**
     * 带会话的聊天，保存历史记录，使用指定模型
     */
    @Override
    public String chatWithHistory(String sessionId, String content, String model) {
        // 获取或创建会话历史
        List<Map<String, String>> messages = sessionHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());
        
        // 添加用户消息
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", content);
        messages.add(userMessage);
        
        // 调用Local AI API
        String response = callLocalAIApi(messages, model);
        
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
     * 调用Local AI API
     */
    public String callLocalAIApi(List<Map<String, String>> messages, String model) {
        // 构建请求URL
        String url = baseUrl + "/chat/completions";
        
        // 构建请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // 构建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("stream", false);
        requestBody.put("temperature", temperature);
        requestBody.put("max_tokens", maxTokens);
        
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
        
        return "Error: No response from Local AI API";
    }

    /**
     * 获取本地可调用的模型列表
     */
    @Override
    public List<Map<String, Object>> getModelList() {
        // 构建请求URL，使用基础URL的根路径，因为/api/tags不在/v1下
        String url = baseUrl.replace("/v1", "/api/tags");
        
        // 发送GET请求
        ResponseEntity<Map> responseEntity = restTemplate.getForEntity(url, Map.class);
        
        // 处理响应
        Map responseBody = responseEntity.getBody();
        if (responseBody != null) {
            return (List<Map<String, Object>>) responseBody.get("models");
        }
        
        return new ArrayList<>();
    }
}