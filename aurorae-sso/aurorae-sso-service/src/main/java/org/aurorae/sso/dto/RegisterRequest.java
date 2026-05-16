package org.aurorae.sso.dto;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * Register Request DTO
 * 
 * @author aurorae
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 16, message = "用户名长度必须在3-16位之间")
    @Pattern(regexp = "^[a-zA-Z]\\w{2,15}$", message = "用户名必须以字母开头")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 16, message = "密码长度必须在8-16位之间")
    @Pattern(regexp = "^[a-zA-Z]\\w{7,15}$", message = "密码必须以字母开头")
    private String password;

    @Email(message = "邮箱格式不正确")
    private String email;

    @Pattern(regexp = "^[1]([3-9])[0-9]{9}$", message = "手机号格式不正确")
    private String phone;
}
