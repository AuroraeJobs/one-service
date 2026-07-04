package com.one.record.service.impl;

import com.one.record.model.LotteryPreference;
import com.one.record.repository.LotteryPreferenceRepository;
import com.one.record.service.ILotteryPreferenceService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@AllArgsConstructor
public class LotteryPreferenceService implements ILotteryPreferenceService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String DEFAULT_TRAINING_SCALE = "standard";

    private static final int DEFAULT_REPLAY_COUNT = 0;

    private static final String DEFAULT_TICKET_SOURCE = "MANUAL";

    private final LotteryPreferenceRepository repository;

    @Override
    public LotteryPreference preference() {
        return repository.findByUserId(DEFAULT_USER_ID).orElseGet(this::defaultPreference);
    }

    @Override
    public LotteryPreference updatePreference(LotteryPreference preference) {
        Long now = System.currentTimeMillis();
        LotteryPreference target = repository.findByUserId(DEFAULT_USER_ID)
                .orElseGet(() -> defaultPreference(now));
        target.setDefaultTrainingScale(normalizeScale(preference == null ? null : preference.getDefaultTrainingScale()));
        target.setDefaultReplayCount(normalizeReplayCount(preference == null ? null : preference.getDefaultReplayCount()));
        target.setAutoSavePredictions(preference != null && Boolean.TRUE.equals(preference.getAutoSavePredictions()));
        target.setDefaultTicketSource(normalizeTicketSource(preference == null ? null : preference.getDefaultTicketSource()));
        target.setUpdatedAt(now);
        return repository.save(target);
    }

    private LotteryPreference defaultPreference() {
        return defaultPreference(System.currentTimeMillis());
    }

    private LotteryPreference defaultPreference(Long now) {
        return LotteryPreference.builder()
                .userId(DEFAULT_USER_ID)
                .defaultTrainingScale(DEFAULT_TRAINING_SCALE)
                .defaultReplayCount(DEFAULT_REPLAY_COUNT)
                .autoSavePredictions(false)
                .defaultTicketSource(DEFAULT_TICKET_SOURCE)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private String normalizeScale(String scale) {
        return StringUtils.hasText(scale) ? scale.trim().toLowerCase() : DEFAULT_TRAINING_SCALE;
    }

    private Integer normalizeReplayCount(Integer replayCount) {
        return replayCount == null || replayCount < 0 ? DEFAULT_REPLAY_COUNT : replayCount;
    }

    private String normalizeTicketSource(String source) {
        return StringUtils.hasText(source) ? source.trim().toUpperCase() : DEFAULT_TICKET_SOURCE;
    }
}
