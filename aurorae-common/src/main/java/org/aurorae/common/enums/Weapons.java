package org.aurorae.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Weapons implements IProvince {

    /**
     * 刀、枪、剑、戟、斧、钺、钩、叉、镗、槊、棍、棒、鞭、锏、锤、抓、拐子、流星。
     * 九朝+春秋战国时期+三国魏晋南北朝时期+五代十国时期
     */
    D(1, "夏朝", "刀"),
    Q(2, "商朝", "枪"),
    N(3, "周朝", "剑"),
    I(4, "春秋", "戟"),
    F(5, "战国", "斧"),
    Y(6, "秦朝", "钺"),
    G(7, "汉朝", "钩"),
    C(8, "三国", "叉"),
    T(9, "晋朝", "镗"),
    S(10, "南朝", "槊"),
    U(11, "北朝", "棍"),
    B(12, "隋朝", "棒"),
    A(13, "唐朝", "鞭"),
    J(14, "五代", "锏"),
    H(15, "宋朝", "锤"),
    Z(16, "元朝", "抓"),
    GZ(17, "明朝", "拐子"),
    LX(18, "清朝", "流星");

    private final int id;
    private final String name;
    private final String label;
}
