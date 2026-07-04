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
public class LotteryProviderHealth implements Serializable {

    private String category;

    private String provider;

    private Boolean active;

    private Boolean registered;

    private String status;

    private Long checkedAt;
}
