package com.one.record.service;

import com.one.record.ai.AiModelOption;

import java.util.List;

public interface IAIModelCacheService {

    List<AiModelOption> getModels();

    List<AiModelOption> getModelsByProvider(String provider);

    List<AiModelOption> refreshModels();

    List<AiModelOption> refreshModelsByProvider(String provider);
}
