package org.aurorae.record;

import org.aurorae.record.ball.BlueBox;
import org.aurorae.record.ball.IBox;
import org.aurorae.record.ball.RedBox;

public class BoxMain {

    public static void main(String[] args) {
        box();
    }

    public static void box() {
        // 红色球1～33，每期抽中6个
        IBox.box(RedBox.one(), "red");
        // 蓝色球1～16，每期抽中1个
        IBox.box(BlueBox.one(), "blue");
    }
}
