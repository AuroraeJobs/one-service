package org.aurorae.core.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * @author aurorae
 * 编码实现：六十四卦，英文名称为Gua64
 * [
 *      "乾", "坤", "屯", "蒙", "需", "讼", "师", "比"
 *      "小畜", "履", "泰", "否", "同人", "大有", "谦", "豫"
 *      "随", "蛊", "临", "观", "噬嗑", "贲", "剥", "复"
 *      "无妄", "大畜", "颐", "大过", "坎", "离", "咸", "恒"
 *      "遁", "大壮", "晋", "明夷", "家人", "睽", "蹇", "解"
 *      "损", "益", "夬", "姤", "萃", "升", "困", "井"
 *      "革", "鼎", "震", "艮", "渐", "归妹", "丰", "旅"
 *      "巽", "兑", "涣", "节", "中孚", "小过", "既济", "未济"
 * ]
 */
@EqualsAndHashCode(callSuper = true)
@Data
@Document("Gua64")
public class Gua64 extends TaiJi {

    /**
     * 错综复杂
     */
    private Long cuoId;
    private Long zongId;
    private Long fuId;
    private Long zaId;

    /**
     * 六爻：每一爻均是太极生两仪中的一仪（或阴或阳）
     * 从下至上，初*、*二、*三、*四、*五，上*
     */
    private Yi high;
    private Yi five;
    private Yi four;
    private Yi three;
    private Yi two;
    private Yi start;

    /**
     * 分三段表示，每段是四象中的一象（每一象分up，low两个位）
     */
    private Xiang tian;
    private Xiang ren;
    private Xiang di;

    /**
     * 分两段表示，每段是八卦中的一卦（每一卦分tian、di、ren三个位）
     */
    private Gua up;
    private Gua low;
}
