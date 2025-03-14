package org.aurorae.tsdb.api;

public interface IMetricValue {

    long getTimestamp();

    void setTimestamp(long timestamp);

    Object getValue();

    void setValue(Object value);
}
