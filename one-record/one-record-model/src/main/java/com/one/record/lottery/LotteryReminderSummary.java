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
public class LotteryReminderSummary implements Serializable {

    private Integer totalCount;

    private Integer activeCount;

    private Integer dueCount;

    private Integer snoozedCount;

    private Integer acknowledgedCount;

    @Builder.Default
    private List<LotteryReminderItem> items = new ArrayList<>();

    private Long generatedAt;
}
