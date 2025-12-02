package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.record.response.Record;
import org.springframework.data.mongodb.core.mapping.Document;

@Slf4j
@Getter
@Setter
@Document("BallBlue")
public class BlueBall extends ColorBall {

    public BlueBall init() {
        super.init(16);
        return this;
    }

    public void record(Record record) {
        super.record(record);
        setRecord(record.blue());
        increase(record.blue());
        check();
    }

    public void check() {
        log.info("> ✅{}: [{} / 6 = {}]", this.getCode(), this.yCount() * 6, this.yCount());
    }
}
