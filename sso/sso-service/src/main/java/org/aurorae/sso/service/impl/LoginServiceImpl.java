package org.aurorae.sso.service.impl;

import com.alibaba.dubbo.config.annotation.Reference;
import com.alibaba.dubbo.config.annotation.Service;
import lombok.extern.log4j.Log4j;
import org.aurorae.manager.pojo.User;
import org.aurorae.manager.service.UserService;
import org.aurorae.sso.service.LoginService;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import javax.annotation.Resource;

/**
 * @author aurorae
 */
@Service
@Component
@Log4j
public class LoginServiceImpl implements LoginService {

    @Reference
    private UserService userService;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    public static final String SESSION = "session";

    @Override
    public User login(String username, String password) {
        HashOperations<String, String, User> redisUserOps = redisTemplate.opsForHash();
        try {
            User redisUser = redisUserOps.get(SESSION, username);
            if (redisUser != null && ObjectUtils.nullSafeEquals(redisUser.getPassword(), password)) {
                log.info("get user from redis:" + redisUser.getUsername());
                return redisUser;
            }
        } catch (Exception e) {
            log.info("redis user get exception:" + e);
        }
        User user = userService.findByUsernameAndPassword(username, password);
        if (user != null) {
            redisUserOps.put(SESSION, username, user);
        } else {
            log.info("no user exist!");
        }
        return user;
    }
}
