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
@Document(collection = "stock_alert_rules")
public class StockAlertRule {

    @Id
    private String id;

    private String userId;

    private String symbol;

    private String market;

    private String code;

    private String name;

    private String ruleType;

    private String direction;

    private BigDecimal targetValue;

    private Boolean enabled;

    private Integer throttleSeconds;

    private Long lastTriggeredAt;

    private Long createdAt;

    private Long updatedAt;
}
