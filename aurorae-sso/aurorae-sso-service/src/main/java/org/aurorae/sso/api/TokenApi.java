package org.aurorae.sso.api;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.exception.UnAuthorizedException;
import org.aurorae.common.util.Login;
import org.aurorae.common.util.Result;
import org.aurorae.common.util.Utils;
import org.aurorae.sso.bean.TokenValid;
import org.aurorae.sso.client.TokenClient;
import org.aurorae.sso.service.TokenService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 令牌 Feign Client 接口实现
 *
 * @author aurorae
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.AUTH_TOKEN_URL_PREFIX)
public class TokenApi implements TokenClient {

    @Resource
    private TokenService tokenService;

    @Override
    public Result<String> generateSalt(Login login) {
        String salt = tokenService.generateSalt(login.getName());
        return null != salt ? Result.ok(salt, "The salt will expire in 5 minutes") : Result.fail();
    }

    @Override
    public Result<String> generateToken(Login login) {
        String token = tokenService.generateToken(login.getTenant(), login.getName(), login.getSalt(), login.getPassword());
        return null != token ? Result.ok(token, "The token will expire in 12 hours.") : Result.fail();
    }

    @Override
    public Result<Long> checkTokenValid(Login login) {
        TokenValid tokenValid = tokenService.checkTokenValid(login.getName(), login.getSalt(), login.getToken());
        if (tokenValid.isValid()) {
            return Result.ok(tokenValid.getExpireTime().getTime(), "The token will expire in " + Utils.formatData(tokenValid.getExpireTime()));
        }
        throw new UnAuthorizedException("Token invalid");
    }

    @Override
    public Result<Boolean> cancelToken(Login login) {
        return tokenService.cancelToken(login.getName()) ? Result.ok() : Result.fail();
    }

    /*static void main(String[] args) {
        System.out.println(Dc3Util.md5("10e339be1130a90dc1b9ff0332abced6" + "dsb785i4ikx0h4wt"));
    }*/
}
