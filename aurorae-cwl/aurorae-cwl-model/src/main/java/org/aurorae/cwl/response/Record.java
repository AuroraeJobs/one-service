package org.aurorae.cwl.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document("BallRecord")
public class Record implements Serializable {

    private String name;

    @Id
    private String code;

    private String detailsLink;

    private String videoLink;

    private String date;

    private String week;

    private String red;

    private String blue;

    private String blue2;

    private String sales;

    private String poolmoney;

    private String content;

    private String addmoney;

    private String addmoney2;

    private String msg;

    private String z2add;

    private String m2add;

    private List<RecordPrizeGrade> prizegrades;

    public String red() {
        return String.join("", this.red.split(","));
    }

    public String blue() {
        return this.blue;
    }

    public String record() {
        return red() + blue();
    }

    public String date() {
        return date.substring(0, 10);
    }
}
