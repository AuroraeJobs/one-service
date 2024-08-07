package org.aurorae.cwl.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.aurorae.cwl.model.CwlObject;
import org.aurorae.cwl.model.CwlValue;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CwlCrease extends CwlObject {

    /**
     * 连续上涨的次数
     */
    private CwlCreaseV increase;
    /**
     * 连续下跌的次数
     */
    private CwlCreaseV decrease;
    /**
     * 连续持平的次数
     */
    private CwlCreaseV equals;

    private CwlValue nextV;
    private CwlValue lastV;

    public CwlCrease init() {
        increase = new CwlCreaseV();
        decrease = new CwlCreaseV();
        equals = new CwlCreaseV();
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

    private void reset(CwlCreaseV v) {
        v.reset(lastV.getCode(), lastV.getDate(), lastV.getLastId());
    }

    public void compareSum(CwlValue next, CwlValue last) {
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
