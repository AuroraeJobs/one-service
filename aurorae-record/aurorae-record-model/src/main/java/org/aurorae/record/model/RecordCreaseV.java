package org.aurorae.record.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecordCreaseV extends RecordObject {

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
     */
    public void reset() {
        if (v > maxV) {
            maxV = v;
        }
        v = 0;
    }
}
