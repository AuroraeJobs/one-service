package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ExprQueryDownsampler {

    /**
     * must provide at least interval and function
     */
    private String interval;

    private String aggregator;

    private FillPolicy fillPolicy;

    public static ExprQueryDownsampler create(String downsample) {
        String[] split = downsample.split("-");
        ExprQueryDownsampler build = ExprQueryDownsampler.builder()
                .interval(split[0])
                .aggregator(split[1])
                .build();
        if (split.length > 2) {
            build.setFillPolicy(FillPolicy.builder().policy(split[2]).build());
        }
        return build;
    }
}
