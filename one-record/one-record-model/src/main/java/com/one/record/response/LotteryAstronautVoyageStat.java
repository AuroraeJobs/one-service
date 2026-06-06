package com.one.record.response;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class LotteryAstronautVoyageStat implements Serializable {

    private String camp;

    private int totalRecords;

    private List<Member> members = new ArrayList<>();

    @Data
    public static class Member implements Serializable {

        private String number;

        private int count;
    }
}
