package com.one.record.lottery;

import com.one.record.model.LotteryStrategyNoteEvidence;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryStrategyNoteAttachRequest implements Serializable {

    private LotteryStrategyNoteEvidence evidence;
}
