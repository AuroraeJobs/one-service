package com.one.record.model;

import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryResearchProvenance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_tickets")
public class LotteryTicket {

    @Id
    private String id;

    private String userId;

    private String issue;

    private Long period;

    @Builder.Default
    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private Integer quantity;

    private BigDecimal cost;

    private String source;

    private String status;

    private String prizeGrade;

    private LotteryPrizeResult prizeResult;

    private String predictionSnapshotId;

    private String ticketPackId;

    private String decisionSetId;

    private String candidateKey;

    private String generationId;

    private LotteryResearchProvenance provenance;

    private String note;

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    private Long updatedAt;
}
