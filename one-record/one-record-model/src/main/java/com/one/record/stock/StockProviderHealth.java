package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockProviderHealth {

    private String provider;

    private Boolean active;

    private Boolean fallback;

    private Boolean registered;

    private String status;

    private Long checkedAt;
}
