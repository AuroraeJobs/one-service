package org.aurorae.record.command;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecordAll {

    public static final int SIZE = 6;
    public static final int FIRST_END = 28;

    private List<RecordRange> records;

    public static RecordAll of() {
        RecordAll one = new RecordAll();
        List<RecordRange> records = new ArrayList<>();
        for (int i = 0; i < SIZE; i++) {
            records.set(i, new RecordRange(FIRST_END + i));
        }
        one.setRecords(records);
        return one;
    }

    public boolean restart() {
        RecordRange first = records.get(0);
        if (first.isEnd()) {
            return false;
        }
        first.setStart(first.getStart() + 1);
        for (int i = 1; i < records.size(); i++) {
            records.get(i).setStart(records.get(i - 1).getStart() + 1);
        }
        return true;
    }

    public RecordRange theLast() {
        return records.get(records.size() - 1);
    }
}
