package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryReminderItem implements Serializable {

    private String key;

    private String group;

    private String title;

    private String message;

    private String status;

    private String severity;

    private String path;

    private String fingerprint;

    private Long dueAt;

    private Long acknowledgedAt;

    private Long snoozedUntil;
}
