package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.aurorae.cwl.response.CwlPrizeGrade;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("Cwl")
public class Cwl implements Serializable {

    @Id
    private String code;

    private String date;

    private String week;

    private int red0;
    private int red1;
    private int red2;
    private int red3;
    private int red4;
    private int red5;

    private int blue;

    public int getRedAvg() {
        return (red0 + red1 + red2 + red3 + red4 + red5) / 6;
    }

    public int getAvg() {
        return (red0 + red1 + red2 + red3 + red4 + red5 + blue) / 7;
    }

    public int getMin() {
        return red0;
    }

    public int getMax() {
        return Math.max(red5, blue);
    }

    public Cwl(String code, String date, String week) {
        this.code = code;
        this.date = date;
        this.week = week;
    }

    public Cwl setRedAndBlue(String red, String blue) {
        String[] split = red.split(",");
        this.red0 = Integer.parseInt(split[0]);
        this.red1 = Integer.parseInt(split[1]);
        this.red2 = Integer.parseInt(split[2]);
        this.red3 = Integer.parseInt(split[3]);
        this.red4 = Integer.parseInt(split[4]);
        this.red5 = Integer.parseInt(split[5]);
        this.blue = Integer.parseInt(blue);
        return this;
    }
}
