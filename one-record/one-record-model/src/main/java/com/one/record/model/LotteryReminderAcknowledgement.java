package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_reminder_acknowledgements")
@CompoundIndex(name = "uniq_lottery_reminder_ack", def = "{'reminderKey': 1, 'fingerprint': 1}", unique = true)
public class LotteryReminderAcknowledgement implements Serializable {

    @Id
    private String id;

    private String reminderKey;

    private String fingerprint;

    private Long acknowledgedAt;
}
