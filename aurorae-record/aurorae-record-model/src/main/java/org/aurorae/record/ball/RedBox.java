package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.record.enums.RedBall;
import org.aurorae.record.file.RecordFile;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class RedBox implements IBox {

    private String readFrom = RecordFile.BALL_RED;

    private Box box;

    private Map<Integer, Box> bit;

    public static IBox one() {
        return new RedBox(RedBall.values());
    }

    public RedBox(IBall[] balls) {
        this.box = Box.one(balls);
        this.bit = new HashMap<>();
        for (int i = 0; i < 6; i++) {
            this.bit.put(i, Box.one(balls));
        }
    }

    @Override
    public void record(String line) {
        String[] records = line.split(",");
        this.box.record(records);
        for (int i = 0; i < this.bit.size(); i++) {
            this.bit.get(i).record(records[i]);
        }
    }

    @Override
    public void writeTo(String filename) {
        this.box.writeTo(filename);
        this.bit.forEach((i, box) -> box.writeTo(filename + i));
    }
}
