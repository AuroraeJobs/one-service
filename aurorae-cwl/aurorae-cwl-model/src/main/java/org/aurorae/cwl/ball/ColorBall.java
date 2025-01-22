package org.aurorae.cwl.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.cwl.model.RecordObject;

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

    public void increase(String key) {
        this.y.computeIfPresent(key, (k, v) -> v + 1);
    }
}
