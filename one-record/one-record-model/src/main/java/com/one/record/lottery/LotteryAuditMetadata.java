package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryAuditMetadata implements Serializable {

    private String action;

    private String source;

    private String requesterScope;

    private Long createdAt;

    private Long updatedAt;
}
