package org.aurorae.record.ball;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.excel.ExcelRow;
import org.aurorae.common.util.StreamUtil;

import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class Box implements IBox {

    private int issue;

    private ExcelRow countRow;

    private final BoxBook book;

    private final Map<String, Ball> ball;

    public Box(IBall[] balls) {
        this.ball = Ball.toMap(balls);
        this.book = BoxBook.one(this.ball.values());
    }

    public static Box one(IBall[] balls) {
        return new Box(balls);
    }

    @Override
    public void record(String record) {
        this.issue();
        // 中奖球的累计次数
        this.countRow(record);
        // 每个球的次数占比
        this.rateRow();
    }

    public void issue() {
        this.issue++;
        this.countRow = this.book.countRow(issue);
    }

    public void countRow(String record) {
        Ball ball = this.ball.get(record);
        ball.count();
        this.book.countRow(this.countRow, ball);
    }

    public void rateRow() {
        Integer count = StreamUtil.reduce(StreamUtil.toList(this.ball.values(), Ball::getCount));
        this.ball.values().forEach(ball -> ball.rate(count));
        this.book.rateRow(this.issue, this.ball.values());
    }

    @Override
    public void writeTo(String filename) {
        this.book.write(filename);
    }

    public void shake() {
        System.out.println("恭喜中奖");
    }
}
