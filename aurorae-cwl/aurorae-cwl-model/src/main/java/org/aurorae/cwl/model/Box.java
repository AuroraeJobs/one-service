package org.aurorae.cwl.model;

import java.util.Map;

import org.aurorae.common.enums.IBall;
import org.aurorae.common.excel.ExcelRow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class Box {

    private final Map<String, Ball> balls;

    private final BoxBook           book;

    public Box(IBall[] balls){
        this.balls = Ball.toMap(balls);
        this.book = BoxBook.one(this.balls.values());
    }

    public static Box one(IBall[] balls) {
        return new Box(balls);
    }

    public void issue(int issue, int total, String... records) {
        ExcelRow row = this.book.getSheet().createRow(issue);
        row.createCell(0, issue);
        for (String record : records) {
            Ball ball = this.balls.get(record);
            ball.increase();
            // 只写中奖号码
            //row.createCell(ball.getColumn(), ball.getCount());
        }
        for (Ball ball : balls.values()) {
            ball.rate(total);
            // 全部号码都写
            //row.createCell(ball.getColumn(), ball.getRate());
        }
    }

    public void writeTo(String filename) {
        this.book.write(filename);
    }
}
