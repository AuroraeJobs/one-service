package org.aurorae.cwl.model;

import lombok.*;
import org.aurorae.common.enums.ProvinceEnum;

import java.util.function.Function;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Province {

    private long id;

    private String name;

    private long count;

    public Province(long id, String name) {
        this.id = id;
        this.name = name;
    }

    public static Province one(long id, String name) {
        return new Province(id, name);
    }

    public static Function<ProvinceEnum, Province> enumOf() {
        return anEnum -> Province.one(anEnum.getId(), anEnum.getLabel());
    }

    public void increase() {
        count++;
    }
}
