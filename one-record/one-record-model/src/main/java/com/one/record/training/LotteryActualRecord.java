package com.one.record.training;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class LotteryActualRecord implements Serializable {

    private int period;

    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;
}
