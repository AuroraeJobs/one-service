package org.aurorae.manager.service;

import org.aurorae.manager.pojo.User;

/**
 * @author aurorae
 */
public interface UserService {

    /**
     * 通过用户名查找用户
     *
     * @param username 用户名
     * @return User
     */
    User findByUsername(String username);

    boolean existsByUsername(String username);

    /**
     * 通过用户名密码查找用户
     *
     * @param username 用户名
     * @param password 密码
     * @return User
     */
    User findByUsernameAndPassword(String username, String password);

    /**
     * 保存用户
     *
     * @param username 用户名
     * @param password 密码
     * @return User
     */
    User save(String username, String password);
}
