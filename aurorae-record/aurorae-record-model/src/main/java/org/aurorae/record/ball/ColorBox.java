package org.aurorae.record.ball;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.record.response.Record;

import java.util.Comparator;
import java.util.List;
import java.util.function.Consumer;

@Slf4j
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ColorBox {

    private RedBall red;

    private BlueBall blue;

    public static ColorBox one() {
        return new ColorBox().init();
    }

    public ColorBox init() {
        this.red = new RedBall().init();
        this.blue = new BlueBall().init();
        return this;
    }

    public void save(List<Record> records, Consumer<ColorBox> save) {
        records.sort(Comparator.comparing(Record::getCode));
        records.forEach(record -> save.accept(record(record)));
    }

    public ColorBox record(Record record) {
        this.red.record(record);
        this.blue.record(record);
        return this;
    }
}
