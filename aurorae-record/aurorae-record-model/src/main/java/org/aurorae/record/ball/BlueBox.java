package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.record.enums.BlueBall;
import org.aurorae.record.file.RecordFile;

@Getter
@Setter
public class BlueBox implements IBox {

    private String readFrom = RecordFile.BALL_BLUE;

    private Box box;

    public static IBox one() {
        return new BlueBox(BlueBall.values());
    }

    public BlueBox(IBall[] balls) {
        this.box = Box.one(balls);
    }

    @Override
    public void record(String line) {
        this.box.record(line);
    }

    @Override
    public void writeTo(String filename) {
        this.box.writeTo(filename);
    }
}
