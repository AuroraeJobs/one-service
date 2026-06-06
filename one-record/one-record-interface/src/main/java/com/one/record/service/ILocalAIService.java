package com.one.record.service;

import java.util.List;
import java.util.Map;

public interface ILocalAIService {

    String chat(String content);

    String chat(String content, String model);

    String chatWithHistory(String sessionId, String content);

    String chatWithHistory(String sessionId, String content, String model);

    void clearHistory(String sessionId);

    List<Map<String, Object>> getModelList();
}
