package org.aurorae.core.model;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.util.StreamUtil;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/**
 * @author aurorae
 * 系统实现：太极，英文名称为TaiJi
 * 抽象逻辑即为：道
 * 道的具体表现在太极上
 * 追求的最终理想即为：道
 * 描述的是：阴阳之道，宇宙自然的秩序
 * 大体上是，大概如此
 * 一句话可以总结为：一阴一阳之谓道
 */
@Getter
@Setter
@Document("X")
public class XX extends X {

    /**
     * 决定编码 'code' 二进制编码的位数
     */
    private int bit;

    /**
     * 编码：二进制
     * 为什么是二进制？阴阳
     */
    @Id
    private String code;

    /**
     * 显示名称
     * 话说，名正言顺
     * 为了研究方便，要先命名
     */
    private String name;

    /**
     * 显示值，表现出来的值，
     * 阳值，当然亦可表达为阴值，
     * 就像阴阳一样，是一个相对来说的值，
     * 是或非，true或false，0或1
     */
    private int value;

    public int count() {
        return (int) Math.pow(2, bit);
    }

    public String toBinaryString(Integer id) {
        return String.format("%0" + bit + "d", Integer.parseInt(Integer.toBinaryString(id)));
    }

    public List<String> allId() {
        return StreamUtil.iterateMap(0, this.count(), this::toBinaryString);
    }
}
