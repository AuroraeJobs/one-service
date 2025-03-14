package org.aurorae.tsdb.opentsdb;

import lombok.*;
import org.springframework.util.CollectionUtils;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricDPs {

    private String metric;
    private Map<String, Object> tags;
    private Map<Long, Object> dps;
    private List<Object> aggregateTags;

    public Long longTag(MetricTagK tagK) {
        return ofTag(tagK, Long::parseLong);
    }

    public <T> T ofTag(MetricTagK tagK, Function<String, T> map) {
        return Optional.ofNullable(this.tags.get(tagK.name()))
                .map(String::valueOf)
                .map(map)
                .orElse(null);
    }

    public static <T> List<T> convert(List<MetricDPs> response, Function<MetricDPs, List<T>> convert) {
        return Optional.ofNullable(response)
                .map(metrics -> metrics.stream()
                        .filter(metric -> !CollectionUtils.isEmpty(metric.getDps()))
                        .map(convert)
                        .flatMap(Collection::stream)
                        .collect(Collectors.toList()))
                .orElse(null);
    }
}
