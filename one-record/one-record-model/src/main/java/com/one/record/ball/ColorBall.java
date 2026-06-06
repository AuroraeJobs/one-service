package com.one.record.ball;

import lombok.Getter;
import lombok.Setter;
import com.one.common.util.StreamUtil;
import com.one.record.model.RecordObject;
import com.one.record.response.Record;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class ColorBall extends RecordObject {

    private String record;

    private String planet;

    private String hexagram;

    private int sum;

    private int oddCount;

    private int evenCount;

    private Map<String, Integer> y;

    public ColorBall init(int index) {
        this.y = init(1, index);
        return this;
    }

    public Map<String, Integer> init(int start, int end) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = start; i <= end; i++) {
            map.put(String.format("%02d", i), 0);
        }
        return map;
    }

    public void record(Record record) {
        setBase(record.getCode(), record.getDate(), record.getWeek(), this.getCode());
    }

    public void increase(String key) {
        this.y.merge(key, 1, Integer::sum);
    }

    public int yCount() {
        return StreamUtil.reduce(this.y.values());
    }

    protected void statistics(String... balls) {
        this.sum = 0;
        this.oddCount = 0;
        this.evenCount = 0;
        for (String ball : balls) {
            if (ball == null || ball.trim().isEmpty()) {
                continue;
            }
            int value = Integer.parseInt(ball.trim());
            this.sum += value;
            if (value % 2 == 0) {
                this.evenCount++;
            } else {
                this.oddCount++;
            }
        }
    }
}
