package org.aurorae.sso.service;

import org.aurorae.manager.pojo.User;

/**
 * @author aurorae
 */
public interface LoginService {

    /**
     * 用户登录
     *
     * @param username 用户名
     * @param password 密码
     * @return User
     */
    User login(String username, String password);
}
