package org.aurorae.tsdb.hbase.table;

import lombok.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HBaseTagKey {

    private String name;

    private int width;

    public static List<HBaseTagKey> create(Map<String, Integer> map) {
        return map.entrySet()
                .stream()
                .map(entry -> HBaseTagKey.builder()
                        .name(entry.getKey())
                        .width(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
