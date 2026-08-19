package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stock_kline_sync_logs")
@CompoundIndex(name = "idx_stock_kline_sync_log_symbol_started_at", def = "{'symbol': 1, 'startedAt': -1}")
@CompoundIndex(name = "idx_stock_kline_sync_log_status_started_at", def = "{'status': 1, 'startedAt': -1}")
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

    @Indexed(name = "idx_stock_kline_sync_log_started_at")
    private Long startedAt;

    private Long finishedAt;
}
