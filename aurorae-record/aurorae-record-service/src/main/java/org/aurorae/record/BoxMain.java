package org.aurorae.record;

import lombok.SneakyThrows;
import org.aurorae.record.ball.Box;
import org.aurorae.record.enums.BlueBall;
import org.aurorae.record.enums.RedBall;
import org.aurorae.record.file.RecordFile;

import java.io.BufferedReader;
import java.util.HashMap;
import java.util.Map;

public class BoxMain {

    public static void main(String[] args) {
        box();
    }

    @SneakyThrows
    public static void box() {
        // 红色球1～33，每期抽中6个
        Box redBox = Box.one(RedBall.values());
        Map<Integer, Box> red = new HashMap<>();
        for (int i = 0; i < 6; i++) {
            red.put(i, Box.one(RedBall.values()));
        }
        try (BufferedReader reader = RecordFile.reader(RecordFile.BALL_RED)) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] records = line.split(",");
                redBox.issue();
                for (int i = 0; i < records.length; i++) {
                    String record = records[i];
                    red.get(i).issue(record);
                    redBox.countRow(record);
                }
                redBox.rateRow();
            }
        }
        redBox.writeTo("red");
        red.forEach((i, box) -> box.writeTo("red" + i));

        // 蓝色球1～16，每期抽中1个
        Box blue = Box.one(BlueBall.values());
        try (BufferedReader reader = RecordFile.reader(RecordFile.BALL_BLUE)) {
            String line;
            while ((line = reader.readLine()) != null) {
                blue.issue(line);
            }
        }
        blue.writeTo("blue");
    }
}
