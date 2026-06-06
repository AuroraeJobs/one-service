package com.one.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Optional;

/**
 * 星宿是中国古代天文学中最核心的概念之一，又称为“二十八舍”或“二十八星”。它相当于将黄道和天赤道附近的天区划分成的二十八个不等的部分。
 * 起源：源于远古中国人民对星辰的自然崇拜。
 * 用途：最初用于观测太阳、月亮、五星（金木水火土）的运行，以判断季节、记载历法、占卜吉凶，是古代中国“天文历法”和“星占学”的基石。
 * 划分：它并不是指28个单独的星星，而是28个星群（星官），每一宿都包含多个恒星。
 * --------------------------------------------------------------------------------
 * 四象与二十八宿
 * 古人将周天星空划分为四大天区，用四种神圣的动物来命名，称为“四象”。每一象统领七个星宿，共二十八宿。
 * 东方苍龙（青色）：代表春天，形如一条腾空的巨龙。
 * 北方玄武（黑色）：代表冬天，形如龟蛇合体。
 * 西方白虎（白色）：代表秋天，形如一只猛虎。
 * 南方朱雀（红色）：代表夏天，形如一只展翅的凤凰。
 */
@Getter
@AllArgsConstructor
public enum Galaxy {

    // 东方苍龙 - The Azure Dragon of the East
    // 从龙头至龙尾
    J01("角宿", 1),
    K02("亢宿", 2),
    D03("氐宿", 3),
    F04("房宿", 4),
    X05("心宿", 5),
    W06("尾宿", 6),
    J07("箕宿", 7),

    // 北方玄武 - The Black Tortoise of the North
    // 玄武从头到尾
    D08("斗宿", 8),
    N09("牛宿", 9),
    N10("女宿", 10),
    X11("虚宿", 11),
    W12("危宿", 12),
    S13("室宿", 13),
    B14("壁宿", 14),

    // 西方白虎 - The White Tiger of the West
    // 从虎头至虎尾
    K15("奎宿", 15),
    L16("娄宿", 16),
    W17("胃宿", 17),
    M18("昴宿", 18),
    B19("毕宿", 19),
    Z20("觜宿", 20),
    S21("参宿", 21),

    // 南方朱雀 - The Vermilion Bird of the South
    // 从鸟喙至鸟尾
    J22("井宿", 22),
    G23("鬼宿", 23),
    L24("柳宿", 24),
    X25("星宿", 25),
    Z26("张宿", 26),
    Y27("翼宿", 27),
    Z28("轸宿", 28)
    ;

    private final String name;
    private final int index;

    public String getNameByIndex(int index, String value) {
        return Optional.ofNullable(getByIndex(Integer.parseInt(value) - index))
                .map(Galaxy::getName)
                .orElse(null);
    }

    /**
     * 根据索引获取星宿
     */
    public static Galaxy getByIndex(int index) {
        for (Galaxy value : values()) {
            if (value.index == index) {
                return value;
            }
        }
        return null;
    }

    /**
     * 根据名称获取星宿
     */
    public static Galaxy getByName(String name) {
        for (Galaxy value : values()) {
            if (value.name.equals(name)) {
                return value;
            }
        }
        return null;
    }
}
