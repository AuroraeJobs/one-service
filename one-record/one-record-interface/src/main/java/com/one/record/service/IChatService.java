package com.one.record.service;

public interface IChatService {

    String chat(String prompt);

    String chatWithHistory(String sessionId, String prompt);

    void clearHistory(String sessionId);
}
