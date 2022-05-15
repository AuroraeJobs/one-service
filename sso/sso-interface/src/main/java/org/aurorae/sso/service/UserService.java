package org.aurorae.sso.service;

import org.aurorae.common.service.Service;
import org.aurorae.sso.cover.UserCover;
import org.aurorae.sso.model.User;

/**
 * User Interface
 *
 * @author aurorae
 */
public interface UserService extends Service<User, UserCover> {

    /**
     * 根据用户名查询用户
     *
     * @param name Username
     * @return User
     */
    User selectByName(String name);

    /**
     * 根据手机号查询用户
     *
     * @param phone Phone
     * @return User
     */
    User selectByPhone(String phone);

    /**
     * 根据邮箱查询用户
     *
     * @param email Email
     * @return User
     */
    User selectByEmail(String email);

    /**
     * 根据用户名判断用户是否存在
     *
     * @param name Username
     * @return boolean
     */
    boolean checkUserValid(String name);

    /**
     * 重置密码
     *
     * @param id Id
     * @return boolean
     */
    boolean restPassword(Long id);
}
