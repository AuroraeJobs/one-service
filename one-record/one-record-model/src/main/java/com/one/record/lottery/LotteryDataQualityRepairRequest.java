package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryDataQualityRepairRequest {

    @Builder.Default
    private List<String> issues = new ArrayList<>();

    private String issueStart;

    private String issueEnd;

    private Integer limit;

    private Boolean confirm;
}
