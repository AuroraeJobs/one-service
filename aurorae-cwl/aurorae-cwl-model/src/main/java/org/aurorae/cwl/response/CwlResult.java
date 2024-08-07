package org.aurorae.cwl.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.aurorae.cwl.model.Cwl;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CwlResult implements Serializable {

    private String name;

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

    private List<CwlPrizeGrade> prizegrades;

    public Cwl convertTo() {
        String[] split = red.split(",");
        return new Cwl(code, date,
                Integer.parseInt(split[0]),
                Integer.parseInt(split[1]),
                Integer.parseInt(split[2]),
                Integer.parseInt(split[3]),
                Integer.parseInt(split[4]),
                Integer.parseInt(split[5]),
                Integer.parseInt(blue));
    }
}
