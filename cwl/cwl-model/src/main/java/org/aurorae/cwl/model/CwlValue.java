package org.aurorae.cwl.model;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@Document("Cwl_Value")
public class CwlValue extends CwlObject {

    private int d0;
    private int d1;
    private int d2;
    private int d3;
    private int d4;

    private int dum;
    private int rum;
    private int sum;

    private int rvg;
    private int avg;

    private int min;
    private int max;

    private int pr;

    public CwlValue(Cwl cwl) {
        super(cwl.getCode(), cwl.getDate(), cwl.getLastId());
        int red0 = cwl.getRed0();
        int red1 = cwl.getRed1();
        int red2 = cwl.getRed2();
        int red3 = cwl.getRed3();
        int red4 = cwl.getRed4();
        int red5 = cwl.getRed5();
        int blue = cwl.getBlue();
        this.d0 = red1 - red0;
        this.d1 = red2 - red1;
        this.d2 = red3 - red2;
        this.d3 = red4 - red3;
        this.d4 = red5 - red4;
        this.dum = red5 - red0;
        this.rum = red0 + red1 + red2 + red3 + red4 + red5;
        this.rvg = rum / 6;
        this.sum = rum + blue;
        this.avg = sum / 7;
        this.min = Math.min(red0, blue);
        this.max = Math.max(red5, blue);
    }
}
