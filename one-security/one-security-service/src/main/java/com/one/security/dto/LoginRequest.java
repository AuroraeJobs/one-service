package com.one.security.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Login Request DTO
 * 
 * @author aurorae
 */
@Data
public class LoginRequest {

    @NotBlank(message = "账号不能为空")
    @Size(max = 64, message = "账号长度不能超过64位")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 30, message = "密码长度必须在8-30位之间")
    @Pattern(regexp = "^[a-zA-Z][\\w-]{7,29}$", message = "密码必须以字母开头，仅支持字母、数字、下划线和短横线")
    private String password;
}
