package org.aurorae.record;

import lombok.SneakyThrows;
import org.aurorae.common.enums.IBall;
import org.aurorae.common.enums.SpaceBall;
import org.aurorae.common.enums.TimeBall;
import org.aurorae.record.file.RecordFile;
import org.aurorae.record.model.Box;

import java.io.BufferedReader;

public class BoxMain {

    public static void main(String[] args) {
        box();
    }

    public static void box() {
        // 红色球1～33，每期抽中6个
        box(SpaceBall.values(), RecordFile.BALL_RED, "space");
        // 蓝色球1～16，每期抽中1个
        box(TimeBall.values(), RecordFile.BALL_BLUE, "time");
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
    }
}
