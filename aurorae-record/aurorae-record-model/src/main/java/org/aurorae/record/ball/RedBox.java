package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.record.enums.RedBall;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class RedBox implements IBox {

    private Box box;

    private Map<Integer, Box> map;

    public static IBox one() {
        return new RedBox(RedBall.values());
    }

    public RedBox(IBall[] balls) {
        this.box = Box.one(balls);
        this.map = new HashMap<>();
        for (int i = 0; i < 6; i++) {
            this.map.put(i, Box.one(balls));
        }
    }

    @Override
    public void record(String line) {
        String[] records = line.split(",");
        this.box.record(records);
        for (int i = 0; i < this.map.size(); i++) {
            this.map.get(i).record(records[i]);
        }
    }

    @Override
    public void writeTo(String filename) {
        this.box.writeTo(filename);
        this.map.forEach((i, box) -> box.writeTo(filename + i));
    }
}
