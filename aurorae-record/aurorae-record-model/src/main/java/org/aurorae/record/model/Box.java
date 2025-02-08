package org.aurorae.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.enums.IBall;
import org.aurorae.common.excel.ExcelRow;

import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class Box {

    private final Map<String, Ball> balls;

    private final BoxBook book;

    private int issue = 0;

    public Box(IBall[] balls) {
        this.balls = Ball.toMap(balls);
        this.book = BoxBook.one(this.balls.values());
    }

    public static Box one(IBall[] balls) {
        return new Box(balls);
    }

    public void issue(String line) {
        issue++;
        String[] records = line.split(",");
        int total = issue * records.length;
        ExcelRow row = this.book.getSheet().createRow(issue);
        row.createCell(0, issue);
        for (String record : records) {
            Ball ball = this.balls.get(record);
            ball.increase();
            // 累计次数
            //row.createCell(ball.getColumn(), ball.getCount());
        }
        for (Ball ball : balls.values()) {
            ball.rate(total);
            // 次数占比
            //row.createCell(ball.getColumn(), ball.getRate());
        }
    }

    public void writeTo(String filename) {
        this.book.write(filename);
    }
}
