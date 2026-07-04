package com.one.record.lottery;

import com.one.record.model.LotteryTicket;
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
public class LotteryTicketImportPreviewRow implements Serializable {

    private String key;

    private Integer lineNumber;

    private String raw;

    private String issue;

    @Builder.Default
    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private String status;

    @Builder.Default
    private List<String> messages = new ArrayList<>();

    private String duplicateGroupKey;

    private String duplicateTicketId;

    private LotteryTicket ticket;
}
