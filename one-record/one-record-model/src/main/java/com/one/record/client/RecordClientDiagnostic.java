package com.one.record.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordClientDiagnostic implements Serializable {

    private Boolean success;

    private String failureCategory;

    private String message;

    private Integer recordCount;

    private Long durationMs;

    private Long checkedAt;

    private String provider;

    private String networkMode;

    private Integer httpStatus;

    private String responseContentType;

    private String responseSnippet;

    private Boolean networkBlockSuspected;
}
