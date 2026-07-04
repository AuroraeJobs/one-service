package com.one.record.model;

import com.one.record.lottery.LotteryAuditMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_recommendations")
public class LotteryRecommendation implements Serializable {

    @Id
    private String id;

    private String userId;

    private String targetType;

    private String targetId;

    private String title;

    private String recommendationState;

    private String lifecycleStatus;

    private Integer confidenceScore;

    private Integer evidenceAgeHours;

    private String expectedAction;

    private String evidenceSummary;

    private String path;

    @Builder.Default
    private List<String> reasons = new ArrayList<>();

    @Builder.Default
    private List<LotteryStrategyNoteEvidence> evidence = new ArrayList<>();

    private Boolean archived;

    private Long generatedAt;

    private Long archivedAt;

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    private Long updatedAt;
}
