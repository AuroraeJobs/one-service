package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ExprQueryMetric {

    private String id;

    private String filter;

    private String metric;

    private String aggregator;

    private FillPolicy fillPolicy;
}
