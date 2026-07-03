package com.one.security.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String username;

    private String email;

    private String phone;

    private String avatar;

    private String password;

    private String role;

    private Boolean enabled;

    private Boolean deleted;

    private Long createTime;

    private Long updateTime;
}
