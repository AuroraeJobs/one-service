package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class LastQueries {
    private List<LastQuery> queries;
    private boolean resolveNames;
    private int backScan;
}
