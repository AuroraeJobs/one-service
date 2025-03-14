package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class FillPolicy {

    private String policy;

    private Double value;
}
