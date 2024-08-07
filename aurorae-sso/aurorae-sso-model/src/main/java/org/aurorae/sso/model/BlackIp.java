package org.aurorae.sso.model;

import lombok.*;
import lombok.experimental.Accessors;
import org.aurorae.common.model.Description;

/**
 * Ip 黑名单表
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class BlackIp extends Description {

    private String ip;
    private Boolean enable;
}
