package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.record.model.RecordObject;
import org.aurorae.record.response.Record;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class ColorBall extends RecordObject {

    private String record;

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
        setBase(record.getCode(), record.getDate(), this.getCode());
    }

    public void increase(String key) {
        this.y.merge(key, 1, Integer::sum);
    }

    public int yCount() {
        return StreamUtil.reduce(this.y.values());
    }
}
