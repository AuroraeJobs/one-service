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

    private String format;

    private String dataPath;

    private String filePath;

    private Integer drawCount;

    private String firstIssue;

    private String latestIssue;

    private String preview;

    private Long generatedAt;
}
