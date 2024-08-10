package org.aurorae.cwl.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
public class CwlRequest {

    private String name;

    private int issueCount;

    private String issueStart;
    private String issueEnd;

    private String dayStart;
    private String dayEnd;

    public CwlRequest() {
        this.name = "ssq";
    }

    public CwlRequest(String name) {
        this.name = name;
    }

    public CwlRequest(int issueCount) {
        this.name = "ssq";
        this.issueCount = issueCount;
    }

    public CwlRequest(String name, int issueCount) {
        this.name = name;
        this.issueCount = issueCount;
    }

    public CwlRequest setIssue(String issueStart, String issueEnd) {
        this.issueStart = issueStart;
        this.issueEnd = issueEnd;
        return this;
    }

    public CwlRequest setDay(String dayStart, String dayEnd) {
        this.dayStart = dayStart;
        this.dayEnd = dayEnd;
        return this;
    }

    public static CwlRequest byCount(int issueCount) {
        return new CwlRequest(issueCount);
    }

    public static CwlRequest byIssue(String issueStart, String issueEnd) {
        return new CwlRequest().setIssue(issueStart, issueEnd);
    }

    public static CwlRequest byDay(String issueStart, String issueEnd) {
        return new CwlRequest().setDay(issueStart, issueEnd);
    }
}
