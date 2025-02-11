package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.record.enums.BlueBall;

@Getter
@Setter
public class BlueBox implements IBox {

    private Box box;

    public static IBox one() {
        return new BlueBox(BlueBall.values());
    }

    public BlueBox(IBall[] balls) {
        this.box = Box.one(balls);
    }

    public void record(String line) {
        this.box.record(line);
    }

    public void writeTo(String filename) {
        this.box.writeTo(filename);
    }
}
