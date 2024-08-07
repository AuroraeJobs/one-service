package org.aurorae.sso.service.impl;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.exception.ServiceException;
import org.aurorae.common.util.KeyUtil;
import org.aurorae.common.util.Utils;
import org.aurorae.sso.bean.TokenValid;
import org.aurorae.sso.bean.UserLimit;
import org.aurorae.sso.model.Tenant;
import org.aurorae.sso.model.User;
import org.aurorae.sso.service.TenantBindService;
import org.aurorae.sso.service.TenantService;
import org.aurorae.sso.service.TokenService;
import org.aurorae.sso.service.UserService;
import org.aurorae.util.RedisUtil;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Calendar;
import java.util.Date;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * 令牌服务接口实现类
 *
 * @author aurorae
 */
@Slf4j
@Service
public class TokenServiceImpl implements TokenService {

    @Resource
    private TenantService tenantService;
    @Resource
    private TenantBindService tenantBindService;
    @Resource
    private UserService userService;

    @Resource
    private RedisUtil redisUtil;

    @Override
    public String generateSalt(String username) {
        String redisSaltKey = Common.Cache.USER + Common.Cache.SALT + Common.Cache.SEPARATOR + username;
        String salt = redisUtil.getKey(redisSaltKey, String.class);
        if (StrUtil.isBlank(salt)) {
            salt = RandomUtil.randomString(16);
            redisUtil.setKey(redisSaltKey, salt, Common.Cache.SALT_CACHE_TIMEOUT, TimeUnit.MINUTES);
        }
        return salt;
    }

    @Override
    public String generateToken(String tenant, String name, String salt, String password) {
        checkUserLimit(name);
        Tenant tempTenant = tenantService.selectByName(tenant);
        User tempUser = userService.selectByName(name);
        if (tempTenant.getEnable() && tempUser.getEnable()) {
            tenantBindService.selectByTenantIdAndUserId(tempTenant.getId(), tempUser.getId());
            String redisSaltKey = Common.Cache.USER + Common.Cache.SALT + Common.Cache.SEPARATOR + name;
            String tempSalt = redisUtil.getKey(redisSaltKey, String.class);
            if (StrUtil.isNotBlank(tempSalt) && tempSalt.equals(salt)) {
                if (Utils.md5(tempUser.getPassword() + tempSalt).equals(password)) {
                    String redisTokenKey = Common.Cache.USER + Common.Cache.TOKEN + Common.Cache.SEPARATOR + name;
                    String token = KeyUtil.generateToken(name, tempSalt);
                    redisUtil.setKey(redisTokenKey, token, Common.Cache.TOKEN_CACHE_TIMEOUT, TimeUnit.HOURS);
                    return token;
                }
            }
        }
        updateUserLimit(name, true);
        throw new ServiceException("Invalid tenant、username、password");
    }

    @Override
    public TokenValid checkTokenValid(String username, String salt, String token) {
        String redisToken = redisUtil.getKey(Common.Cache.USER + Common.Cache.TOKEN + Common.Cache.SEPARATOR + username, String.class);
        if (StrUtil.isBlank(redisToken) || !redisToken.equals(token)) {
            return new TokenValid(false, null);
        }
        try {
            Claims claims = KeyUtil.parserToken(username, salt, token);
            return new TokenValid(true, claims.getExpiration());
        } catch (Exception e) {
            return new TokenValid(false, null);
        }
    }

    @Override
    public boolean cancelToken(String username) {
        redisUtil.deleteKey(Common.Cache.USER + Common.Cache.TOKEN + Common.Cache.SEPARATOR + username);
        return true;
    }

    /**
     * 检测用户登录限制，返回该用户是否受限
     *
     * @param username Username
     */
    private void checkUserLimit(String username) {
        String redisKey = Common.Cache.USER + Common.Cache.LIMIT + Common.Cache.SEPARATOR + username;
        UserLimit limit = redisUtil.getKey(redisKey, UserLimit.class);
        if (null != limit && limit.getTimes() >= 5) {
            Date now = new Date();
            long interval = limit.getExpireTime().getTime() - now.getTime();
            if (interval > 0) {
                limit = updateUserLimit(username, false);
                throw new ServiceException("Access restricted，Please try again after {}", Utils.formatData(limit.getExpireTime()));
            }
        }
    }

    /**
     * 更新用户登录限制
     *
     * @param username Username
     * @return UserLimit
     */
    private UserLimit updateUserLimit(String username, boolean expireTime) {
        int amount = Common.Cache.USER_LIMIT_TIMEOUT;
        String redisKey = Common.Cache.USER + Common.Cache.LIMIT + Common.Cache.SEPARATOR + username;
        UserLimit limit = Optional.ofNullable(redisUtil.getKey(redisKey, UserLimit.class)).orElse(new UserLimit(0, new Date()));
        limit.setTimes(limit.getTimes() + 1);
        if (limit.getTimes() > 20) {
            //TODO 拉黑IP和锁定用户操作，然后通过Gateway进行拦截
            amount = 24 * 60;
        } else if (limit.getTimes() > 5) {
            amount = limit.getTimes() * Common.Cache.USER_LIMIT_TIMEOUT;
        }
        if (expireTime) {
            limit.setExpireTime(Utils.expireTime(amount, Calendar.MINUTE));
        }
        redisUtil.setKey(redisKey, limit, 1, TimeUnit.DAYS);
        return limit;
    }
}
