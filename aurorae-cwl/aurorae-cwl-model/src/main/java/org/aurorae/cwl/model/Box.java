package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.enums.SpaceBall;
import org.aurorae.common.enums.TimeBall;

import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class Box {

    /**
     * 空间，对应红色球1～33，用大陆的33个行政区命名
     */
    private Map<Integer, Ball> space;

    /**
     * 时间，对应蓝色球1～16，取二十四-节气的其中16个命名
     */
    private Map<Integer, Ball> time;

    public Box() {
        this.space = Ball.toMap(SpaceBall.values());
        this.time = Ball.toMap(TimeBall.values());
    }

    public static Box one() {
        return new Box();
    }

    public Ball space(int id) {
        return this.space.get(id);
    }

    public Ball time(int id) {
        return this.time.get(id);
    }
}
