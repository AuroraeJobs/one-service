package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.util.StreamUtil;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@Document("BallRed")
public class RedBall extends ColorBall {

    private Map<Integer, Map<String, Integer>> z;

    public RedBall init() {
        super.init(33);
        this.z = new HashMap<>();
        for (int i = 0; i < 6; i++) {
            this.z.put(i, super.init(i + 1, i + 28));
        }
        return this;
    }

    public void increase(Integer index, String key) {
        super.increase(key);
        this.z.computeIfPresent(index, (idx, map) -> {
            map.computeIfPresent(key, (k, v) -> v + 1);
            return map;
        });
    }

    public int zCount() {
        return StreamUtil.reduce(StreamUtil.flatList(this.z.values(), Map::values));
    }
}
