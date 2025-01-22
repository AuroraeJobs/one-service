package org.aurorae.cwl.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.aurorae.cwl.model.RecordObject;
import org.aurorae.cwl.model.RecordValue;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecordCrease extends RecordObject {

    /**
     * 连续上涨的次数
     */
    private RecordCreaseV increase;
    /**
     * 连续下跌的次数
     */
    private RecordCreaseV decrease;
    /**
     * 连续持平的次数
     */
    private RecordCreaseV equals;

    private RecordValue nextV;
    private RecordValue lastV;

    public RecordCrease init() {
        increase = new RecordCreaseV();
        decrease = new RecordCreaseV();
        equals = new RecordCreaseV();
        return this;
    }

    public void increase() {
        reset(decrease);
        reset(equals);
        increase.count();
    }

    public void decrease() {
        reset(increase);
        reset(equals);
        decrease.count();
    }

    public void equals() {
        reset(increase);
        reset(decrease);
        equals.count();
    }

    private void reset(RecordCreaseV v) {
        v.reset(lastV.getCode(), lastV.getDate(), lastV.getLast());
    }

    public void compareSum(RecordValue next, RecordValue last) {
        this.nextV = next;
        this.lastV = last;
        int v = next.getSum() - last.getSum();
        if (v > 0) {
            increase();
        } else if (v < 0) {
            decrease();
        } else {
            equals();
        }
    }
}
