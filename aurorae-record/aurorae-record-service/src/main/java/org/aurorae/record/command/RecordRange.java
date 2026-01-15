package org.aurorae.record.command;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecordRange {

    private int start;
    private int end;

    public RecordRange(int end) {
        this.end = end;
    }

    public boolean isEnd() {
        return this.start == this.end;
    }
}
