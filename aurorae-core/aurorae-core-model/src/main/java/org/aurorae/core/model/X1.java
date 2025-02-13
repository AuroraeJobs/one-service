package org.aurorae.core.model;

import lombok.Getter;
import lombok.Setter;

/**
 * @author aurorae
 * 编码实现：仪，英文名称为Yi
 * 易有太极，是生两仪
 * 太极生两仪，两仪生四象，继而八卦，继而六十四卦
 *
 * <p>
 * 有时显示为：阳（yang）
 * 有时显示为：阴（yin）
 * 阴阳合一即为：太极（TaiJi）
 * 2^0, 2^true, 2^2, 2^3, 2^6
 * 注意，上面的两个用词，["合", "生"]
 * 太极生两仪，注意是生，不是分，不是分成两仪
 * 就像一个人，生有两个手掌，不是分，两个手掌并没有分，同身体合二为一
 * 太极讲的是一个合的过程，不是向外分
 * <p>
 * 阴中有阳，阳中有阴
 * 阴极成阳，阳极成阴
 * 显示为阳的时候，不是阴没有了，反之亦然
 * 也不是：阳就是阳，阴就是阴
 * 所以，这里，并没有什么特殊的逻辑，就是两种极简的状态，两种能量
 * 呈现为阳时 yang = 3, yin = 0
 * 呈现为阴时 yin = 2, yang = 0
 * 阴极成阳，阳极生阴
 * {"两仪": ["阳","阴"]}
 */
@Getter
@Setter
public class X1 extends XX {

    /**
     * 阳 ——
     * 阴 --
     */
    private XX xx;

    public X1() {
        super.setBit(1);
    }
}
