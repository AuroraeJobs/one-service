package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stock_alert_history")
public class StockAlertHistory {

    @Id
    private String id;

    private String userId;

    private String ruleId;

    private String symbol;

    private String ruleType;

    private String direction;

    private BigDecimal targetValue;

    private BigDecimal triggerValue;

    private String message;

    private Long triggeredAt;

    private Long createdAt;
}
