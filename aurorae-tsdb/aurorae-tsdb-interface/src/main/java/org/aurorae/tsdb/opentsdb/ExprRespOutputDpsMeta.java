package org.aurorae.tsdb.opentsdb;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExprRespOutputDpsMeta {

    private long firstTimestamp;
    private long lastTimestamp;
    private int setCount;
    private int series;
}
