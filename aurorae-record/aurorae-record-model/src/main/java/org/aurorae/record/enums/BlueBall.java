package org.aurorae.record.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.aurorae.record.ball.IBall;

@Getter
@AllArgsConstructor
public enum BlueBall implements IBall {

    /**
     * 刀、枪、剑、戟、斧、钺、钩、叉、镗、槊、棍、棒、鞭、锏、锤、抓、拐子、流星。
     */
    PD("01", "浦东", "刀"),
    MH("02", "闵行", "枪"),
    XH("03", "徐汇", "剑"),
    JA("04", "静安", "戟"),
    HP("05", "黄浦", "斧"),
    JD("06", "嘉定", "钺"),
    CN("07", "长宁", "钩"),
    YP("08", "杨浦", "叉"),
    BS("09", "宝山", "镗"),
    SJ("10", "松江", "槊"),
    QP("11", "青浦", "棍"),
    FX("12", "奉贤", "棒"),
    PT("13", "普陀", "鞭"),
    HK("14", "虹口", "锏"),
    JS("15", "金山", "锤"),
    CM("16", "崇明", "抓");

    private final String id;
    private final String name;
    private final String label;
}
