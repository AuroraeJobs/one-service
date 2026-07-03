package com.one.record.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "stock.market")
public class StockMarketProperties {

    private String source = "sina";

    private String provider = "sina";

    private List<String> fallbackProviders = List.of();

    private String sinaQuoteUrl = "https://hq.sinajs.cn/list=";

    private String sinaKlineUrl = "https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData";

    private String referer = "https://finance.sina.com.cn";

    private String userAgent = "Mozilla/5.0";

    private String charset = "GBK";

    private Integer connectTimeoutSeconds = 5;

    private Integer readTimeoutSeconds = 10;

    private Boolean cacheEnabled = true;

    private Integer quoteCacheTtlSeconds = 10;

    private Integer fallbackCacheTtlSeconds = 604800;

    private Integer providerProbeTtlSeconds = 86400;

    private List<String> defaultSymbols = List.of("sh000001", "sz399001", "sz399006");

    private Boolean klineSyncEnabled = true;

    private String klineSyncCron = "0 30 15 * * MON-FRI";

    private List<String> klineSyncSymbols = List.of("sh000001", "sz399001", "sz399006");

    private Boolean alertEvaluationEnabled = true;

    private String alertEvaluationCron = "0 */5 9-15 * * MON-FRI";
}
