package org.aurorae.sso.model;

import lombok.*;
import lombok.experimental.Accessors;
import org.aurorae.common.model.Description;
import org.aurorae.common.valid.Auth;
import org.aurorae.common.valid.Insert;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * User
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class Tenant extends Description {

    @NotBlank(message = "name can't be empty", groups = {Insert.class, Auth.class})
    @Pattern(regexp = "^[a-zA-Z]\\w{2,15}$", message = "invalid name , /^[a-zA-Z]\\w{2,15}$/", groups = {Insert.class})
    private String name;

    private Boolean enable;
}
