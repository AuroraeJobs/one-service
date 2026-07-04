package com.one.record.model;

import com.one.record.lottery.LotteryAuditMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_strategy_notes")
public class LotteryStrategyNote {

    @Id
    private String id;

    private String userId;

    private String title;

    private String hypothesis;

    private String expectedBehavior;

    private String ruleName;

    private String targetIssue;

    private String status;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private List<LotteryStrategyNoteEvidence> evidence = new ArrayList<>();

    private Boolean archived;

    private Long archivedAt;

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    private Long updatedAt;
}
