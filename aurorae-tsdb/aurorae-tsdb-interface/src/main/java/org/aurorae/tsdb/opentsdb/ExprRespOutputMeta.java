package org.aurorae.tsdb.opentsdb;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ExprRespOutputMeta {

    private long index;
    private List<String> metrics;

    private Map<String, Object> commonTags;
    private List<String> aggregatedTags;
}
