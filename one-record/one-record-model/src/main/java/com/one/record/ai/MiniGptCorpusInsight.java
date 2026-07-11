package com.one.record.ai;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class MiniGptCorpusInsight implements Serializable {

    private String data;

    private String resolvedPath;

    private Integer charCount;

    private Integer lineCount;

    private Integer sampleCount;

    private Integer minimumSampleTokens;

    private Integer maximumSampleTokens;

    private Integer requiredBlockSize;

    private Integer recommendedBlockSize;

    private String tokenizerType;

    private String corpusVersion;

    private String corpusFormat;

    private Integer schemaVersion;

    private String templateVersion;

    private String trainSha256;

    private String validationSha256;

    private String provenanceStatus;

    private Integer vocabSize;

    private String preview;

    private String sampleText;

    @Builder.Default
    private List<Integer> encodedSample = new ArrayList<>();

    private String decodedSample;

    @Builder.Default
    private List<TokenEntry> tokens = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    public static class TokenEntry implements Serializable {

        private String token;

        private Integer tokenId;

        private Integer codePoint;

        private String display;
    }
}
