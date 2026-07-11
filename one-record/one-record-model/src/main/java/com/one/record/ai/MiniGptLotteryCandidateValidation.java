package com.one.record.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MiniGptLotteryCandidateValidation implements Serializable {

    private String sourceText;

    private List<String> redNumbers;

    private String blueNumber;

    private Integer redCount;

    private Boolean valid;

    private Boolean parseable;

    private Integer redSum;

    private Integer span;

    private Integer oddCount;

    private Integer evenCount;

    private Integer duplicateCount;

    private Boolean redAscending;

    private String status;

    private List<String> issues;

    private List<String> issueCodes;

    private Boolean repairApplied;

    private List<String> repairActions;

    private Boolean postRepairValid;

    private List<String> repairedRedNumbers;

    private String repairedBlueNumber;
}
