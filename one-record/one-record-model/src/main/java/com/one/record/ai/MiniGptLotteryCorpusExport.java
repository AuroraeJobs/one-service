package com.one.record.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MiniGptLotteryCorpusExport implements Serializable {

    private Integer schemaVersion;

    private String templateVersion;

    private String corpusVersion;

    private String format;

    private String splitMode;

    private Double validationRatio;

    private String sortOrder;

    private String dataPath;

    private String filePath;

    private String legacyDataPath;

    private String fullDataPath;

    private String fullFilePath;

    private String trainDataPath;

    private String trainFilePath;

    private String validationDataPath;

    private String validationFilePath;

    private String manifestDataPath;

    private String manifestFilePath;

    private Integer drawCount;

    private Integer trainDrawCount;

    private Integer validationDrawCount;

    private String firstIssue;

    private String latestIssue;

    private String trainFirstIssue;

    private String trainLatestIssue;

    private String validationFirstIssue;

    private String validationLatestIssue;

    private String contentSha256;

    private String trainSha256;

    private String validationSha256;

    private String preview;

    private Long generatedAt;
}
