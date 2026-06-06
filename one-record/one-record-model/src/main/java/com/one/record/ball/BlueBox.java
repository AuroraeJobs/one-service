package com.one.record.ball;

import lombok.Getter;
import lombok.Setter;
import com.one.record.enums.BlueBall;
import com.one.record.file.RecordFile;

@Getter
@Setter
public class BlueBox implements IBox {

    private String readFrom = RecordFile.BALL_BLUE;

    private Box box;

    public static void one() {
        new BlueBox(BlueBall.values()).box();
    }

    public BlueBox(IBall[] balls) {
        this.box = Box.one(balls);
    }

    @Override
    public void record(String line) {
        this.box.record(line);
    }

    @Override
    public void writeTo() {
        String filename = "blue";
        this.box.writeTo(filename);
    }
}
