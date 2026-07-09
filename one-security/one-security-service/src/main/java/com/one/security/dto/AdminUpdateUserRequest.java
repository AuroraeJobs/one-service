package com.one.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 16, message = "用户名长度必须在3-16位之间")
    @Pattern(regexp = "^[a-zA-Z]\\w{2,15}$", message = "用户名必须以字母开头")
    private String username;

    @Email(message = "邮箱格式不正确")
    private String email;

    private String phone;

    private String avatar;

    private String role;

    private Boolean enabled;
}
