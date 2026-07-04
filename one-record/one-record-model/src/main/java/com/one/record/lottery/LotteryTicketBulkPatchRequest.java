package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryTicketBulkPatchRequest {

    @Builder.Default
    private List<String> ids = new ArrayList<>();

    private String issue;

    private Integer quantity;

    private BigDecimal cost;

    private String status;

    private String source;

    private String note;

    private Boolean clearNote;
}
