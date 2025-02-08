package org.aurorae.record.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.aurorae.record.client.RecordCalendar;
import org.springframework.data.annotation.Id;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecordObject {

    @Id
    private String code;
    private String last;
    private String next;

    private String date;
    private String week;

    private int year;
    private int month;
    private int day;

    private boolean start;
    private boolean end;

    public void setBase(String code, String date, String last) {
        // 设置上一个节点
        this.last = last;

        // 设置当前节点
        this.code = code;

        // date format: yyyy-MM-dd(week)
        this.date = date.substring(0, 10);
        this.week = date.substring(11, 12);

        this.year = Integer.parseInt(date.substring(0, 4));
        this.month = Integer.parseInt(date.substring(5, 7));
        this.day = Integer.parseInt(date.substring(8, 10));

        this.start = "001".equals(this.code.substring(4, 7));
        this.end = this.month == 12 && this.day + RecordCalendar.nextIssueDay(this.week) > 31;

        // 设置下一个节点
        this.next = this.end ? (this.year + 1) + "001" : String.valueOf(Long.parseLong(this.code) + 1);
    }
}
