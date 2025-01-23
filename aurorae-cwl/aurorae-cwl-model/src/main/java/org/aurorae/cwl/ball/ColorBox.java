package org.aurorae.cwl.ball;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.response.Record;

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

    private String last;

    public ColorBox init() {
        this.red = new RedBall().init();
        this.blue = new BlueBall().init();
        return this;
    }

    public void save(List<Record> records, Consumer<ColorBox> save) {
        records.sort(Comparator.comparing(Record::getCode));
        for (Record record : records) {
            save.accept(record(record));
            this.last = record.getCode();
            check();
        }
    }

    public ColorBox record(Record record) {
        red(record);
        blue(record);
        return this;
    }

    public void red(Record record) {
        this.red.setBase(record.getCode(), record.getDate(), this.last);
        this.red.setRecord(record.red());
        String[] reds = record.getRed().split(",");
        for (int i = 0; i < 6; i++) {
            this.red.increase(i, reds[i]);
        }
    }

    private void blue(Record record) {
        this.blue.setBase(record.getCode(), record.getDate(), this.last);
        this.blue.setRecord(record.blue());
        this.blue.increase(record.blue());
    }

    public void check() {
        log.info("\n> {}: [{}] = [{}] = [{} / 6 = {}]",
                this.last,
                this.red.yCount(),
                this.red.zCount(),
                this.blue.yCount() * 6,
                this.blue.yCount()
        );
    }
}
