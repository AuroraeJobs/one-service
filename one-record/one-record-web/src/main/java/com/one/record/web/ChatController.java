package com.one.record.web;

import com.one.record.service.IChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private IChatService deepSeekChatService;

    /**
     * 简单聊天接口，不保存历史记录
     */
    @PostMapping("/completions")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String response = deepSeekChatService.chat(request.getPrompt());
        return new ChatResponse(response);
    }

    /**
     * 带会话的聊天接口，保存历史记录
     */
    @PostMapping("/completions/{sessionId}")
    public ChatResponse chatWithHistory(@PathVariable String sessionId, @RequestBody ChatRequest request) {
        String response = deepSeekChatService.chatWithHistory(sessionId, request.getPrompt());
        return new ChatResponse(response);
    }

    /**
     * 清空会话历史
     */
    @DeleteMapping("/sessions/{sessionId}")
    public void clearHistory(@PathVariable String sessionId) {
        deepSeekChatService.clearHistory(sessionId);
    }

    // 请求参数类
    public static class ChatRequest {
        private String prompt;

        public String getPrompt() {
            return prompt;
        }

        public void setPrompt(String prompt) {
            this.prompt = prompt;
        }
    }

    // 响应参数类
    public static class ChatResponse {
        private String response;

        public ChatResponse(String response) {
            this.response = response;
        }

        public String getResponse() {
            return response;
        }

        public void setResponse(String response) {
            this.response = response;
        }
    }
}