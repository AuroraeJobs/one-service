package org.aurorae.core.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * @author aurorae
 * 编码实现：卦，英文名称为Gua
 * 四象生八卦：
 * 天相关：天（乾），风（巽），火（离），泽（兑）
 * 地相关：地（坤），雷（震），水（坎），山（艮）
 * 这八个卦象，是宇宙万象构成的八个元素
 * ["乾", "巽", "离", "兑", "坤", "震", "坎", "艮"]
 * alias
 * ["天", "风", "火", "泽", "地", "雷", "水", "山"]
 *
 * 一阴一阳之谓道，乾坤易之门
 * 自然本不分天地，
 */
@EqualsAndHashCode(callSuper = true)
@Data
@Document("Gua")
public class X3 extends XX {

    private X1 x1_0;

    /**
     * 人位：人道，为人之道
     * 延伸到人处在一个什么地位，也要像天行天道的那样行人道
     * 人之为人的本分
     * 凡是人为的用一字表达就是：伪
     * 天地良心，凭良心行走在天地间，peace && love
     * 所以什么是良心？
     * 不做作的自然，夜深人静之时，内心深处的那一份平静
     * 没有装饰，不做任何修饰的淳朴，赤子之心
     * 《晚婚》歌里唱的：让我擦去脸上的脂粉
     *
     * 人是能感受天地冷暖的
     * 天地赋予你的这个功能
     * 不只是让你冷暖自知
     * 而是要让你感知到他人的冷暖，那样的你才是一个知冷知热，贴心的人
     *
     * 本来也不分天地，不分你我
     * 从没有人的那个空间到现在
     * 天地万物，我们作为人，研究的对象便是人
     * 儒家，孔子所提倡的仁：表示二人，两个人的关系，延伸到人与人之间的关系
     * 所以人在天地之间所扮演的角色是什么？
     * 人活着的意义大概如此
     * 平衡点，阴阳的互动
     */
    private X1 x1_1;

    private X1 x1_2;

    public X3() {
        super.setBit(3L);
    }
}
