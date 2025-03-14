package org.aurorae.tsdb.opentsdb;

public class TsdbQueryLast extends TsdbQueryList<LastQueries, LastValue> {

    public TsdbQueryLast() {
        super(Endpoint.QUERY_LAST, LastValue.class);
    }
}
