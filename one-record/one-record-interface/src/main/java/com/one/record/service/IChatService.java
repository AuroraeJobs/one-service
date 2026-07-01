package com.one.record.service;

public interface IChatService {

    String chat(String prompt);

    String chat(String prompt, String model);

    String chatWithHistory(String sessionId, String prompt);

    String chatWithHistory(String sessionId, String prompt, String model);

    void clearHistory(String sessionId);
}
