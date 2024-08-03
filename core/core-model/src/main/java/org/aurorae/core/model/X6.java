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
public class X6 extends XX {

    /**
     * 错综复杂
     */
    private Long cuo;
    private Long zun;
    private Long fu;
    private Long za;

    /**
     * 六爻：每一爻均是太极生两仪中的一仪（或阴或阳）
     * 从下至上，初*、*二、*三、*四、*五，上*
     */
    private X1 x1_0;
    private X1 x1_1;
    private X1 x1_2;
    private X1 x1_3;
    private X1 x1_4;
    private X1 x1_5;

    /**
     * 分三段表示，每段是四象中的一象（每一象分up，low两个位）
     */
    private X2 x2_0;
    private X2 x2_1;
    private X2 x2_2;

    /**
     * 分两段表示，每段是八卦中的一卦（每一卦分tian、di、ren三个位）
     */
    private X3 x3_0;
    private X3 x3_1;

    public X6() {
        super.setBit(6L);
    }
}
