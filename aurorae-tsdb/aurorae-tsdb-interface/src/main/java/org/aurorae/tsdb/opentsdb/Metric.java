package org.aurorae.tsdb.opentsdb;

import lombok.AllArgsConstructor;
import lombok.Getter;

public class Metric {

    @Getter
    @AllArgsConstructor
    public enum Prefix {

        p("Product"),
        d("Device"),
        u("User"),
        ;

        private final String desc;
        public String metric(long metricId) {
            return name() + metricId;
        }
    }
}
