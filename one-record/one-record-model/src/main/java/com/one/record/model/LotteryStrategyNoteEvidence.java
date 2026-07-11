package com.one.record.model;

import com.one.record.lottery.LotteryResearchProvenance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

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

    @Builder.Default
    private List<LotteryResearchProvenance> provenance = new ArrayList<>();

    private Long attachedAt;
}
