package com.one.security.dto;

import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
    @Size(min = 8, max = 30, message = "密码长度必须在8-30位之间")
    @Pattern(regexp = "^[a-zA-Z][\\w-]{7,29}$", message = "密码必须以字母开头，仅支持字母、数字、下划线和短横线")
    private String password;

    @Email(message = "邮箱格式不正确")
    private String email;

    @Pattern(regexp = "^[1]([3-9])[0-9]{9}$", message = "手机号格式不正确")
    private String phone;

    private String avatar;
}
