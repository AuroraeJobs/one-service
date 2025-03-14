package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ExprQueryOutput {

    private String id;

    private String alias;
}
