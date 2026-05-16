package org.aurorae.sso.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * Login Request DTO
 * 
 * @author aurorae
 */
@Data
public class LoginRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 16, message = "用户名长度必须在3-16位之间")
    @Pattern(regexp = "^[a-zA-Z]\\w{2,15}$", message = "用户名必须以字母开头")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 16, message = "密码长度必须在8-16位之间")
    @Pattern(regexp = "^[a-zA-Z]\\w{7,15}$", message = "密码必须以字母开头")
    private String password;
}
