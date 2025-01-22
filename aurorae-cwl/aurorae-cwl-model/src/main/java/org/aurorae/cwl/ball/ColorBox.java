package org.aurorae.cwl.ball;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.aurorae.cwl.response.Record;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ColorBox {

    private RedBall red;

    private BlueBall blue;

    public ColorBox init() {
        this.red = new RedBall().init();
        this.blue = new BlueBall().init();
        return this;
    }

    public ColorBox result(Record result, String last) {
        setBase(result.getCode(), result.getDate(), last);
        increase(result.getRed().split(","), result.getBlue());
        record(result.red(), result.blue());
        return this;
    }

    private void record(String red, String blue) {
        this.red.setRecord(red);
        this.blue.setRecord(blue);
    }

    public void setBase(String code, String date, String last) {
        this.red.setBase(code, date, last);
        this.blue.setBase(code, date, last);
    }

    public void increase(String[] red, String blue) {
        for (int i = 0; i < 6; i++) {
            this.red.increase(i, red[i]);
        }
        this.blue.increase(blue);
    }
}
