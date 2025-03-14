package org.aurorae.tsdb.opentsdb;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExprRespOutput {
    private String id;
    private String alias;
    private List<List<Object>> dps;
    private ExprRespOutputDpsMeta dpsMeta;
    private List<ExprRespOutputMeta> meta;
}
