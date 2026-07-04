package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryPageResponse<T> implements Serializable {

    @Builder.Default
    private List<T> items = new ArrayList<>();

    private Integer page;

    private Integer pageSize;

    private Long total;

    private Boolean hasNext;
}
