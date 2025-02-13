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

    private int issue;

    private final BoxBook book;

    private final Map<String, Ball> ball;

    public Box(IBall[] balls) {
        this.ball = Ball.toMap(balls);
        this.book = BoxBook.one(this.allBall());
    }

    public static Box one(IBall[] balls) {
        return new Box(balls);
    }

    public Ball oneBall(String key) {
        return this.ball.get(key);
    }

    public Collection<Ball> allBall() {
        return this.ball.values();
    }

    public Collection<Ball> sortBall() {
        return StreamUtil.sort(this.allBall(), Ball::getCount);
    }

    public Collection<Ball> countBall(String... record) {
        // 更新中奖球的累计次数
        return StreamUtil.mapEach(record, this::oneBall, Ball::count);
    }

    public Collection<Ball> rateBall() {
        // 计算每个球的次数占比
        int count = StreamUtil.reduce(this.allBall(), Ball::getCount);
        return StreamUtil.forEach(this.allBall(), ball -> ball.rate(count));
    }

    public void record(String... record) {
        this.book.issueRow(this.issue++, countBall(record), rateBall());
    }

    public void writeTo(String filename) {
        this.book.write(filename);
    }

    public void shake() {
        System.out.println("恭喜中奖 [" + this.issue + "]" + StreamUtil.joining(this.sortBall(), Ball::print, "\n", "\n", "\n"));
    }
}
