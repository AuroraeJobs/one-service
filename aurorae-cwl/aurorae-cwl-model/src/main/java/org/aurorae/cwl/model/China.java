package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.enums.IProvince;
import org.aurorae.common.enums.IslandProvince;
import org.aurorae.common.enums.InlandProvince;
import org.aurorae.common.util.StreamUtil;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class China {

    /**
     * 大陆，对应红色球1～33，用大陆的33个行政区命名
     */
    private Map<Integer, Province> inland;

    /**
     * 台湾，对应蓝色球1～16，用十八般兵器前16个命名
     */
    private Map<Integer, Province> island;

    public China() {
        this.inland = StreamUtil.toMap(InlandProvince.values(), IProvince::getId, Province.enumOf());
        this.island = StreamUtil.toMap(IslandProvince.values(), IProvince::getId, Province.enumOf());
    }

    public static China one() {
        return new China();
    }

    public Province inlandOf(int id) {
        return this.inland.get(id);
    }

    public Province islandOf(int id) {
        return this.island.get(id);
    }

    public static void increase(Province province) {
        Optional.ofNullable(province).ifPresent(Province::increase);
    }

    public static void count(Province province, long count) {
        Optional.ofNullable(province).ifPresent(i -> i.setCount(count));
    }

    public static void count(Map<Integer, Province> province, List<Integer> list) {
        StreamUtil.groupingByCounting(list, Function.identity())
                .forEach((id, count) -> count(province.get(id), count));
    }
}
