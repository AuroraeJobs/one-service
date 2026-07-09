package com.one.security.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSummary {

    private String id;
    private String username;
    private String email;
    private String phone;
    private String avatar;
    private String role;
    private Boolean enabled;
    private Long createTime;
    private Long updateTime;
}
