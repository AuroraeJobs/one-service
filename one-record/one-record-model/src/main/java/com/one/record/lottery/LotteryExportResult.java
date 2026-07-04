package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryExportResult implements Serializable {

    private String exportId;

    private String exportType;

    private String format;

    @Builder.Default
    private Map<String, String> filters = new LinkedHashMap<>();

    private Integer rowCount;

    private String requesterScope;

    private Long generatedAt;

    private String fileName;

    private String content;
}
