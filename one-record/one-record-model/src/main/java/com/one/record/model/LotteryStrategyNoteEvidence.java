package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryStrategyNoteEvidence implements Serializable {

    private String evidenceKey;

    private String evidenceType;

    private String title;

    private String sourceId;

    private String path;

    private Long attachedAt;
}
