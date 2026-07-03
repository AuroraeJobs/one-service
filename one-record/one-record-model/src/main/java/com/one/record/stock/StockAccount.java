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
@Document(collection = "stock_accounts")
public class StockAccount {

    @Id
    private String id;

    private String userId;

    private String name;

    private String broker;

    private String accountNo;

    private String currency;

    private BigDecimal cashBalance;

    private String status;

    private Long createdAt;

    private Long updatedAt;
}
