package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.enums.ProvinceEnum;
import org.aurorae.common.util.StreamUtil;

import java.util.Map;
import java.util.Optional;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class China {

    private Map<Long, Province> provinceMap;

    public China() {
        this.provinceMap = StreamUtil.toMap(ProvinceEnum.values(), ProvinceEnum::getId, Province.enumOf());
    }

    public static China one() {
        return new China();
    }

    public Province getProvince(long id) {
        return this.provinceMap.get(id);
    }

    public void increase(long id) {
        Optional.ofNullable(getProvince(id)).ifPresent(Province::increase);
    }

    public void count(int id, long count) {
        Optional.ofNullable(getProvince(id)).ifPresent(i -> i.setCount(count));
    }

    public void count(Map<Integer, Long> counter) {
        counter.forEach(this::count);
    }
}
