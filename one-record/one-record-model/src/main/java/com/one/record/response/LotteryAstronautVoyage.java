package com.one.record.response;

import lombok.Data;
import com.one.record.model.LotteryAstronaut;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class LotteryAstronautVoyage implements Serializable {

    private LotteryAstronaut astronaut;

    private List<VoyageRecord> records = new ArrayList<>();

    @Data
    public static class VoyageRecord implements Serializable {

        private String id;

        private long period;

        private String raw;

        private List<String> redNumbers = new ArrayList<>();

        private String blueNumber;

        private String planetName;

        private int redSum;

        private int oddCount;

        private int evenCount;

        private String hexagramName;
    }
}
