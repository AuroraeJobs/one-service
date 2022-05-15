package org.aurorae.sso.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.Accessors;
import org.aurorae.common.model.Description;
import org.aurorae.common.valid.Auth;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;

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
public class User extends Description {

    @NotBlank(message = "name can't be empty", groups = {Insert.class, Auth.class})
    @Pattern(regexp = "^[a-zA-Z]\\w{2,15}$", message = "invalid name , /^[a-zA-Z]\\w{2,15}$/", groups = {Insert.class})
    private String name;

    @Pattern(regexp = "^[1]([3-9])[0-9]{9}$", message = "invalid phone , /^[1]([3-9])[0-9]{9}$/", groups = {Insert.class, Update.class})
    private String phone;

    @Pattern(regexp = "^([a-zA-Z0-9_\\.-])+@(([a-zA-Z0-9\\-])+\\.)+([a-zA-Z0-9]{2,4})+$", message = "invalid email , /^([a-zA-Z0-9_\\.-])+@(([a-zA-Z0-9-])+\\.)+([a-zA-Z0-9]{2,4})+$/", groups = {Insert.class, Update.class})
    private String email;

    @JsonInclude(JsonInclude.Include.NON_DEFAULT)
    @NotBlank(message = "password can't be empty", groups = {Insert.class, Auth.class})
    @Pattern(regexp = "^[a-zA-Z]\\w{7,15}$", message = "invalid password , /^[a-zA-Z]\\w{7,15}$/", groups = {Insert.class, Update.class})
    private String password;

    private Boolean enable;

}
