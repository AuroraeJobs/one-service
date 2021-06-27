package org.aurorae.manager.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.aurorae.manager.pojo.User;

/**
 * @author aurorae
 */
public interface UserRepository extends MongoRepository<User, Long> {

    /**
     * 通过用户名查找用户
     *
     * @param username 用户名
     * @return User
     */
    User findByUsername(String username);

    /**
     * 通过用户名密码查找用户
     *
     * @param username 用户名
     * @param password 密码
     * @return User
     */
    User findByUsernameAndPassword(String username, String password);

    /**
     * 用户名是否存在
     *
     * @param username 用户名
     * @return 是否存在
     */
    boolean existsByUsername(String username);
}
