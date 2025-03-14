package org.aurorae.tsdb.opentsdb;

import org.aurorae.common.util.StringUtil;
import lombok.*;
import lombok.experimental.Accessors;

import java.util.Optional;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ExprQueryTime extends TsdbTime {

    private String aggregator;

    private Object timezone;

    private ExprQueryDownsampler downsampler;

    private boolean rate;

    public ExprQueryTime(Object start, Object end) {
        super(start, end);
    }

    public ExprQueryTime(Object times) {
        super(times);
    }

    public ExprQueryTime setAggregatorAndDownsample(Aggregator aggregator, String downsample) {
        this.aggregator = Optional.ofNullable(aggregator).orElse(Aggregator.NONE).getName();
        if (StringUtil.isNotEmpty(downsample) && downsample.contains("-")) {
            this.downsampler = ExprQueryDownsampler.create(downsample);
        }
        return this;
    }
}
