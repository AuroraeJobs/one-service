package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stock_preferences")
public class StockPreference {

    @Id
    private String id;

    private String userId;

    private String defaultAccountId;

    private String defaultCurrency;

    private String defaultKLinePeriod;

    private Integer quoteRefreshIntervalSeconds;

    private Long createdAt;

    private Long updatedAt;
}
