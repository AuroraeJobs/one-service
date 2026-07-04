package com.one.record.lottery;

import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.training.LotteryTrainingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryWorkbenchSummary implements Serializable {

    private LotteryDailyState dailyState;

    private LotteryDraw latestDraw;

    private LotteryRecordSyncSummary latestSyncSummary;

    private LotteryDataQualityReport dataQualitySummary;

    private LotteryPredictionSnapshot latestPrediction;

    private LotteryTrainingStatus trainingStatus;

    private Integer pendingTicketCount;

    private LotteryTicketPrizeCheckSummary latestPrizeCheckSummary;

    private LotteryLedgerSummary ledgerSummary;

    private Long generatedAt;
}
