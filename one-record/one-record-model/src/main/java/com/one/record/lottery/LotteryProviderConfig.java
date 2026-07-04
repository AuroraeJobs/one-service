package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryProviderConfig implements Serializable {

    private String activeDrawProvider;

    @Builder.Default
    private List<String> registeredDrawProviders = new ArrayList<>();

    private Boolean scheduledSyncEnabled;

    private Long generatedAt;
}
