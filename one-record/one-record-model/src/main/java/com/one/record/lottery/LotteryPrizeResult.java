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
public class LotteryPrizeResult implements Serializable {

    private Integer redHits;

    private Boolean blueHit;

    private String prizeGrade;

    private String prizeName;

    private Integer prizeLevel;

    private Long prizeAmount;

    private Boolean winning;
}
