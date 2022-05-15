package org.aurorae.sso.model;

import lombok.*;
import lombok.experimental.Accessors;
import org.aurorae.common.model.Description;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;

import javax.validation.constraints.NotNull;

/**
 * 租户关系表
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class TenantBind extends Description {

    @NotNull(message = "tenant id can't be empty", groups = {Insert.class, Update.class})
    private Long tenantId;

    @NotNull(message = "user id can't be empty", groups = {Insert.class, Update.class})
    private Long userId;

}
