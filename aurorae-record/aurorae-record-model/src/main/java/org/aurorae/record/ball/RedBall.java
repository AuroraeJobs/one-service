package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.record.response.Record;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashMap;
import java.util.Map;

@Slf4j
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

    public void record(Record record) {
        super.record(record);
        setRecord(record.red());
        String[] reds = record.getRed().split(",");
        for (int i = 0; i < reds.length; i++) {
            String key = reds[i];
            increase(key);
            this.z.get(i).merge(key, 1, Integer::sum);
        }
        check();
    }

    public int zCount() {
        return StreamUtil.reduce(StreamUtil.flatList(this.z.values(), Map::values));
    }

    public void check() {
        log.info("> {}: [{}] = [{}]", this.getCode(), this.yCount(), this.zCount());
    }
}
