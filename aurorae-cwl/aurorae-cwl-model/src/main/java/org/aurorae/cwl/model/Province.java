package org.aurorae.cwl.model;

import lombok.*;
import org.aurorae.common.enums.IProvince;
import org.aurorae.common.util.StreamUtil;

import java.util.Map;
import java.util.function.Function;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Province implements IProvince {

    private int id;

    private String name;

    private String label;

    private long count;

    public Province(int id, String name, String label) {
        this.id = id;
        this.name = name;
        this.label = label;
    }

    public static Province one(int id, String name, String label) {
        return new Province(id, name, label);
    }

    public static <P extends IProvince> Function<P, Province> enumOf() {
        return item -> Province.one(item.getId(), item.getName(), item.getLabel());
    }

    public static Map<Integer, Province> toMap(IProvince[] provinces) {
        return StreamUtil.toMap(provinces, IProvince::getId, Province.enumOf());
    }

    public void increase() {
        count++;
    }
}
