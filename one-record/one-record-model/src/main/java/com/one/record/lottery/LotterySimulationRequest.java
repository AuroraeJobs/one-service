package com.one.record.lottery;

import com.one.record.model.LotteryTicket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotterySimulationRequest implements Serializable {

    private String targetIssue;

    private BigDecimal budgetLimit;

    private Integer replayWindow;

    @Builder.Default
    private Map<String, BigDecimal> ruleWeights = new LinkedHashMap<>();

    @Builder.Default
    private List<String> portfolioIds = new ArrayList<>();

    @Builder.Default
    private List<LotteryTicket> candidateTickets = new ArrayList<>();
}
