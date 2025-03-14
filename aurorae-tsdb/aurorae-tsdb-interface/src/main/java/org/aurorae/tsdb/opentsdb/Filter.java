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
public class Filter {

    private String id;

    private List<FilterTag> tags;

    private boolean explicitTags;
}
