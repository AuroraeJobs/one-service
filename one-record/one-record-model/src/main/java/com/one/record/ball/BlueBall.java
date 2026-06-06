package com.one.record.ball;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import com.one.record.response.Record;
import com.one.record.util.LotteryBallUtil;
import org.springframework.data.mongodb.core.mapping.Document;

@Slf4j
@Getter
@Setter
@Document("blue_records")
public class BlueBall extends ColorBall {

    public BlueBall init() {
        super.init(16);
        return this;
    }

    public void record(Record record) {
        super.record(record);
        setRecord(record.getBlue());
        setPlanet(LotteryBallUtil.bluePlanet(record.getBlue()));
        setHexagram(LotteryBallUtil.blueHexagram(record.getBlue()));
        statistics(record.getBlue());
        increase(record.getBlue());
        check();
    }

    public void check() {
        log.info("> ✅{}: [{} / 6 = {}]", this.getCode(), this.yCount() * 6, this.yCount());
    }
}
