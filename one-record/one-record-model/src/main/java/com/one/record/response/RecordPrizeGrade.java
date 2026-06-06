package com.one.record.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordPrizeGrade implements Serializable {

    /**
     * 几等奖
     */
    private String type;

    /**
     * 中奖注数
     */
    private String typenum;

    /**
     * 中奖金额
     */
    private String typemoney;
}
