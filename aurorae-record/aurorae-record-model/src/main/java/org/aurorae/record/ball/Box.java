package org.aurorae.record.ball;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.util.StreamUtil;

import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class Box {

    private int issue;

    private final BoxBook book;

    private final Map<String, Ball> ball;

    public Box(IBall[] balls) {
        this.ball = Ball.toMap(balls);
        this.book = BoxBook.one(this.ball.values());
    }

    public static Box one(IBall[] balls) {
        return new Box(balls);
    }

    public void record(String... records) {
        this.issue++;
        // 中奖球的累计次数
        this.book.countRow(this.issue, StreamUtil.mapEach(records, this.ball::get, Ball::count));
        // 每个球的次数占比
        Integer count = StreamUtil.reduce(StreamUtil.toList(this.ball.values(), Ball::getCount));
        this.ball.values().forEach(ball -> ball.rate(count));
        this.book.rateRow(this.issue, this.ball.values());
    }

    public void writeTo(String filename) {
        this.book.write(filename);
    }

    public void shake() {
        System.out.println("恭喜中奖");
    }
}
