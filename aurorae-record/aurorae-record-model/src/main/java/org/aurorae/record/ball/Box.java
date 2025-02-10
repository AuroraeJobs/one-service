package org.aurorae.record.ball;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.util.StreamUtil;

import java.util.Collection;
import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class Box {

    private int issue = 0;

    private final BoxBook book;

    private final Map<String, Ball> ball;

    public Box(IBall[] balls) {
        this.ball = Ball.toMap(balls);
        this.book = BoxBook.one(this.ball.values());
    }

    public static Box one(IBall[] balls) {
        return new Box(balls);
    }

    public Collection<Ball> count(String[] records) {
        return StreamUtil.mapEach(records, this.ball::get, Ball::count);
    }

    public Collection<Ball> rate(int total) {
        return StreamUtil.forEach(this.ball.values(), ball -> ball.rate(total));
    }

    public void issue(String line) {
        issue++;
        String[] records = line.split(",");
        // 中奖球的累计次数
        this.book.countRow(issue, count(records));
        // 每个球的次数占比
        this.book.rateRow(issue, rate(issue * records.length));
    }

    public void writeTo(String filename) {
        this.book.write(filename);
    }

    public void shake() {
        System.out.println("恭喜中奖");
    }
}
