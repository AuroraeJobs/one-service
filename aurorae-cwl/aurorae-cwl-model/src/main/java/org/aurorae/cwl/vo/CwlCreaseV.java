package org.aurorae.cwl.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.aurorae.cwl.model.CwlObject;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CwlCreaseV extends CwlObject {

    /**
     * 连续上涨、下跌或持平的次数
     */
    private int v;
    /**
     * 连续上涨、下跌或持平的最大次数
     */
    private int maxV;

    /**
     * 计数
     */
    public void count() {
        v++;
    }

    /**
     * 复位
     *
     * @param code code
     */
    public void reset(String code, String date, Long lastId) {
        if (v > maxV) {
            maxV = v;
            setBase(code, date, lastId);
        }
        v = 0;
    }
}
