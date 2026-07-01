package com.one.record.service;

import java.util.Map;

public interface IOpenAIModelService {

    Map<String, Object> getOpenAIModels();

    Map<String, Object> getDeepSeekModels();
}
