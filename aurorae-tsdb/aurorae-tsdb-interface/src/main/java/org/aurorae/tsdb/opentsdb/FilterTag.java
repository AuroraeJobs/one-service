package org.aurorae.tsdb.opentsdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.Accessors;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class FilterTag {

    @JsonProperty(value = "type", required = true)
    private String type;

    @JsonProperty(value = "tagk", required = true)
    private String tagk;

    @JsonProperty(value = "filter", required = true)
    private Object filter;

    @JsonProperty("groupBy")
    private boolean groupBy;

    public static FilterTag create(String tagk, Object filter) {
        return FilterTag.builder()
                .tagk(tagk)
                .filter(filter)
                .type(FilterType.LITERAL_OR.getName())
                .groupBy(false)
                .build();
    }

    public static List<FilterTag> create(Map<String, Object> tags) {
        return tags
                .entrySet()
                .stream()
                .map(entry -> create(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    public static List<FilterTag> create(String[][] tags) {
        return Arrays.stream(tags)
                .map(tag -> create(tag[0], tag[1])
                )
                .collect(Collectors.toList());
    }
}
