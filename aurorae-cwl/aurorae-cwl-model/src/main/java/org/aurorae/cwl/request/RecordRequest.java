package org.aurorae.cwl.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RecordRequest {

    private String name;

    private long issueCount;

    private String issueStart;
    private String issueEnd;

    private String dayStart;
    private String dayEnd;

    public RecordRequest() {
        this.name = "ssq";
    }

    public RecordRequest(String name) {
        this.name = name;
    }

    public RecordRequest(long issueCount) {
        this.name = "ssq";
        this.issueCount = issueCount;
    }

    public RecordRequest(String name, long issueCount) {
        this.name = name;
        this.issueCount = issueCount;
    }

    public RecordRequest setIssue(String issueStart, String issueEnd) {
        this.issueStart = issueStart;
        this.issueEnd = issueEnd;
        return this;
    }

    public RecordRequest setDay(String dayStart, String dayEnd) {
        this.dayStart = dayStart;
        this.dayEnd = dayEnd;
        return this;
    }

    public static RecordRequest by(long issueCount) {
        return new RecordRequest(issueCount);
    }

    public static RecordRequest by(String start, String end) {
        return start.length() == 7 ? byIssue(start, end) : byDay(start, end);
    }

    public static RecordRequest byIssue(String issueStart, String issueEnd) {
        return new RecordRequest().setIssue(issueStart, issueEnd);
    }

    public static RecordRequest byDay(String dayStart, String dayEnd) {
        return new RecordRequest().setDay(dayStart, dayEnd);
    }
}
