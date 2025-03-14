package org.aurorae.tsdb.opentsdb;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExprResponse {

    private List<ExprRespOutput> outputs;

    private ExprQuery query;
}
