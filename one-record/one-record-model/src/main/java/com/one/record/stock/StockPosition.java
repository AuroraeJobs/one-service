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
@Document(collection = "stock_positions")
public class StockPosition {

    @Id
    private String id;

    private String userId;

    private String accountId;

    private String symbol;

    private String market;

    private String code;

    private String name;

    private BigDecimal quantity;

    private BigDecimal availableQuantity;

    private BigDecimal costPrice;

    private BigDecimal costAmount;

    private Long openedAt;

    private Long createdAt;

    private Long updatedAt;
}
