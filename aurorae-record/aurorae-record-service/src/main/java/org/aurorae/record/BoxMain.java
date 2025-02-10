package org.aurorae.record;

import lombok.SneakyThrows;
import org.aurorae.record.ball.IBall;
import org.aurorae.record.enums.RedBall;
import org.aurorae.record.enums.BlueBall;
import org.aurorae.record.file.RecordFile;
import org.aurorae.record.ball.Box;

import java.io.BufferedReader;

public class BoxMain {

    public static void main(String[] args) {
        box();
    }

    public static void box() {
        // 红色球1～33，每期抽中6个
        box(RedBall.values(), RecordFile.BALL_RED, "red");
        // 蓝色球1～16，每期抽中1个
        box(BlueBall.values(), RecordFile.BALL_BLUE, "blue");
    }

    @SneakyThrows
    public static void box(IBall[] balls, String readFrom, String writeTo) {
        Box box = Box.one(balls);
        try (BufferedReader reader = RecordFile.reader(readFrom)) {
            String line;
            while ((line = reader.readLine()) != null) {
                box.issue(line);
            }
        }
        box.writeTo(writeTo);
        box.shake();
    }
}
