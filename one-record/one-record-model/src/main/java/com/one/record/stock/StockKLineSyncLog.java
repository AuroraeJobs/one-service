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
@Document(collection = "stock_kline_sync_logs")
public class StockKLineSyncLog {

    @Id
    private String id;

    private String jobName;

    private String symbol;

    private String period;

    private String status;

    private Integer requestedCount;

    private Integer savedCount;

    private String message;

    private Long startedAt;

    private Long finishedAt;
}
