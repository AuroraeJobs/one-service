package com.one.record.model;

import com.one.record.lottery.LotteryAuditMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_strategy_portfolios")
public class LotteryStrategyPortfolio implements Serializable {

    @Id
    private String id;

    private String userId;

    private String name;

    private String description;

    private String status;

    private BigDecimal allocationWeight;

    @Builder.Default
    private List<EvidenceLink> evidence = new ArrayList<>();

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private Boolean archived;

    private Long archivedAt;

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    private Long updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvidenceLink implements Serializable {

        private String evidenceType;

        private String sourceId;

        private String title;

        private String path;

        private BigDecimal allocationWeight;

        private String note;

        private Long attachedAt;
    }
}
