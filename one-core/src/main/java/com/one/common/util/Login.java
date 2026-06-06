package com.one.common.util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import com.one.common.valid.Auth;
import com.one.common.valid.Check;
import com.one.common.valid.Update;

import javax.validation.constraints.NotBlank;

/**
 * Login
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Login {

    @NotBlank(message = "tenant can't be empty", groups = {Auth.class})
    private String tenant;

    @NotBlank(message = "name can't be empty", groups = {Check.class, Auth.class, Update.class})
    private String name;

    @NotBlank(message = "salt can't be empty", groups = {Check.class, Auth.class})
    private String salt;

    @NotBlank(message = "password can't be empty", groups = {Auth.class})
    private String password;

    @NotBlank(message = "token can't be empty", groups = {Check.class})
    private String token;

}
