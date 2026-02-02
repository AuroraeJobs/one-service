package org.aurorae.record.web;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.aurorae.record.service.ILocalAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
public class LocalAIController {

    @Autowired
    private ILocalAIService localAIService;

    /**
     * 简单聊天接口，不保存历史记录（Local AI）
     */
    @PostMapping("/local/completions")
    public ChatResponse localChat(@RequestBody ChatRequest request) {
        String model = request.getModel() != null ? request.getModel() : "qwen3:8b"; // 默认模型
        String response = localAIService.chat(request.getPrompt(), model);
        return new ChatResponse(response);
    }

    /**
     * 带会话的聊天接口，保存历史记录（Local AI）
     */
    @PostMapping("/local/completions/{sessionId}")
    public ChatResponse localChatWithHistory(@PathVariable String sessionId, @RequestBody ChatRequest request) {
        String model = request.getModel() != null ? request.getModel() : "qwen3:8b"; // 默认模型
        String response = localAIService.chatWithHistory(sessionId, request.getPrompt(), model);
        return new ChatResponse(response);
    }

    /**
     * 清空会话历史（Local AI）
     */
    @DeleteMapping("/local/sessions/{sessionId}")
    public void clearLocalHistory(@PathVariable String sessionId) {
        localAIService.clearHistory(sessionId);
    }

    /**
     * 获取本地可调用的模型列表
     */
    @GetMapping("/local/models")
    public java.util.Map<String, java.util.List<java.util.Map<String, Object>>> getLocalModels() {
        java.util.List<java.util.Map<String, Object>> models = localAIService.getModelList();
        java.util.Map<String, java.util.List<java.util.Map<String, Object>>> response = new java.util.HashMap<>();
        response.put("models", models);
        return response;
    }

    // 请求参数类
    @Setter
    @Getter
    public static class ChatRequest {
        private String prompt;
        private String model;
    }

    // 响应参数类
    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String response;
    }
}
