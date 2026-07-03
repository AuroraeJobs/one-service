package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryDraw implements Serializable {

    private String id;

    private String issue;

    private Long period;

    private String drawDate;

    private String raw;

    private List<String> redNumbers;

    private String blueNumber;

    private Integer redSum;

    private Integer oddCount;

    private Integer evenCount;

    private Integer bigCount;

    private Integer smallCount;

    private Integer span;

    private Integer consecutivePairs;

    private String combination;

    private String planetName;

    private String hexagramCode;

    private String hexagramName;

    private String source;

    private Long sourceUpdatedAt;

    private Long createdAt;

    private Long updatedAt;
}
