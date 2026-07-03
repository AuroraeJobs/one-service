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
@Document(collection = "stock_trades")
public class StockTrade {

    @Id
    private String id;

    private String userId;

    private String accountId;

    private String symbol;

    private String market;

    private String code;

    private String name;

    private String tradeType;

    private BigDecimal quantity;

    private BigDecimal price;

    private BigDecimal amount;

    private BigDecimal fee;

    private BigDecimal tax;

    private Long tradedAt;

    private String remark;

    private Long createdAt;

    private Long updatedAt;
}
