package org.aurorae.core.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.aurorae.common.util.IdGenerator;
import org.springframework.data.annotation.Id;

import java.util.Map;

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
@EqualsAndHashCode(callSuper = true)
@Data
public class TaiJi extends Dao {

    @Id
    private Long id;

    /**
     * 决定编码 'code' 二进制编码的位数
     */
    private Long bit;

    /**
     * 编码：二进制
     * 为什么是二进制？阴阳
     */
    private String code;

    /**
     * 显示名称
     * 话说，名正言顺
     * 为了研究方便，要先命名
     */
    private String name;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 别名，又名
     */
    private String alias;

    /**
     * 显示符号
     * 外在表现出来的，象
     */
    private String label;

    /**
     * 描述
     */
    private String desc;

    /**
     * 显示值，表现出来的值，
     * 阳值，当然亦可表达为阴值，
     * 就像阴阳一样，是一个相对来说的值，
     * 是或非，true或false，0或1
     */
    private Object value;

    /**
     * 键值对
     */
    private Map<Object, Object> values;

    public void newId() {
        id = IdGenerator.nextId(this.getClass().getSimpleName());
    }

    public void setCode() {
        this.code = String.format("%0" + bit + "d", (Long.parseLong(Long.toBinaryString(id))));
    }
}
