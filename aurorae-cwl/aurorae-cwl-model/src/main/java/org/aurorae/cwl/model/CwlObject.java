package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.aurorae.common.model.BaseObject;
import org.aurorae.cwl.enums.CwlWeek;
import org.aurorae.cwl.util.CwlDateUtil;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CwlObject extends BaseObject {

    private String date;
    private String week;
    private int year;
    private int month;
    private int day;
    private boolean firstOfYear;
    private boolean lastOfYear;

    private String last;
    private String next;
    private Long lastId;
    private Long nextId;

    public CwlObject(String code, String date) {
        setBaseInfo(code, date);
    }

    public CwlObject(String code, String date, Long lastId) {
        setBaseInfo(code, date);
        setLastById(lastId);
    }

    public void setBase(String code, String date, Long lastId) {
        setBaseInfo(code, date);
        setLastById(lastId);
    }

    public void setBaseInfo(String code, String date) {
        setCode(code);
        setId(Long.parseLong(code));
        this.date = date;
        this.week = date.substring(11, 12);
        this.year = Integer.parseInt(date.substring(0, 4));
        this.month = Integer.parseInt(date.substring(5, 7));
        this.day = Integer.parseInt(date.substring(8, 10));
        // 20xx001算作当年的第一期
        this.firstOfYear = "001".equals(code.substring(4, 7));
        // 12月份的日期 + 下一期的间隔天数 > 31，算作当年的最后一期
        this.lastOfYear = (month == 12 && (day + nextIssueDay()) > 31);
        setNextId(isLastOfYear() ? Long.parseLong((year + 1) + "001") : (getId() + 1));
        setNext(String.valueOf(getNextId()));
    }

    public void setLastById(Long lastId) {
        this.lastId = lastId;
        this.last = String.valueOf(lastId);
    }

    public int nextIssueDay() {
        return CwlDateUtil.nextIssueDay(week);
    }

    public int week() {
        return CwlWeek.getValueByName(week);
    }
}
