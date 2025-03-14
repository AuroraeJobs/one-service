package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.MapUtil;
import org.aurorae.common.util.StringUtil;
import org.aurorae.tsdb.api.IMetricPut;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricPut implements IMetricPut {

    private String metric;
    private long timestamp;
    private Object value;
    private Map<String, Object> tags;

    public MetricPut addTag(String tagK, Object tagV) {
        if (StringUtil.isNotEmpty(tagV)) {
            this.tags.put(tagK, tagV);
        }
        return this;
    }

    @Slf4j
    @Builder
    @AllArgsConstructor
    @Accessors(chain = true)
    public static class Build<Put extends MetricPut> {

        private String metric;
        private long timestamp;
        private Object value;
        private Map<String, Object> tags;

        public Build<Put> setMetric(String metric) {
            this.metric = metric;
            return this;
        }

        public Build<Put> addTag(MetricTagK tagK, Object tagV) {
            return addTag(tagK.name(), tagV);
        }

        public Build<Put> addTag(String tagK, Object tagV) {
            if (StringUtil.isNotEmpty(tagV)) {
                this.tags = MapUtil.putValue(this.tags, tagK, tagV);
            }
            return this;
        }

        public Build<Put> addTags(Map<String, Object> tags) {
            this.tags = MapUtil.putValue(this.tags, tags);
            return this;
        }

        public Put build(Class<Put> putClass) {
            try {
                Put put = putClass.newInstance();
                put.setMetric(this.metric);
                put.setTimestamp(this.timestamp);
                put.setValue(this.value);
                put.setTags(this.tags);
                return put;
            } catch (InstantiationException | IllegalAccessException e) {
                log.error(e.getMessage(), e);
                return null;
            }
        }
    }
}
