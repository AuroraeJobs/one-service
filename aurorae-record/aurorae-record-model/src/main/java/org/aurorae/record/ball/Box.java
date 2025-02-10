package org.aurorae.record.ball;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.excel.ExcelRow;
import org.aurorae.common.util.StreamUtil;

import java.util.Collection;
import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class Box {

    private int issue = 0;

    private ExcelRow row;

    private final BoxBook book;

    private final Map<String, Ball> ball;

    public Box(IBall[] balls) {
        this.ball = Ball.toMap(balls);
        this.book = BoxBook.one(this.ball.values());
    }

    public static Box one(IBall[] balls) {
        return new Box(balls);
    }

    public Ball count(String record) {
        Ball ball = this.ball.get(record);
        ball.count();
        return ball;
    }

    public Collection<Ball> rate() {
        Integer count = StreamUtil.reduce(StreamUtil.toList(this.ball.values(), Ball::getCount));
        return StreamUtil.forEach(this.ball.values(), ball -> ball.rate(count));
    }

    public void issue(String record) {
        this.issue();
        // 中奖球的累计次数
        this.countRow(record);
        // 每个球的次数占比
        this.rateRow();
    }

    public void issue() {
        this.issue++;
        this.row = this.book.countRow(issue);
    }

    public void countRow(String record) {
        this.book.countRow(this.row, this.count(record));
    }

    public void rateRow() {
        this.book.rateRow(this.issue, rate());
    }

    public void writeTo(String filename) {
        this.book.write(filename);
    }

    public void shake() {
        System.out.println("恭喜中奖");
    }
}
