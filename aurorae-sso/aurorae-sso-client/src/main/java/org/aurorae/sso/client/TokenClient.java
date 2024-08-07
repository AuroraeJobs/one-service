package org.aurorae.sso.client;

import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Login;
import org.aurorae.common.util.Result;
import org.aurorae.common.valid.Auth;
import org.aurorae.common.valid.Check;
import org.aurorae.common.valid.Update;
import org.aurorae.sso.hystrix.TokenClientHystrix;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * 令牌 FeignClient
 *
 * @author aurorae
 */
@FeignClient(path = Common.Service.AUTH_TOKEN_URL_PREFIX, name = Common.Service.AUTH_SERVICE_NAME, fallbackFactory = TokenClientHystrix.class)
public interface TokenClient {

    /**
     * 生成用户随机 Salt
     *
     * @param login Login
     * @return Result<String>
     */
    @PostMapping("/salt")
    Result<String> generateSalt(@Validated(Update.class) @RequestBody Login login);

    /**
     * 生成用户 Token 令牌
     *
     * @param login Login
     * @return Result<String>
     */
    @PostMapping("/generate")
    Result<String> generateToken(@Validated(Auth.class) @RequestBody Login login);

    /**
     * 检测用户 Token 令牌是否有效
     *
     * @param login Login
     * @return Result<Boolean>
     */
    @PostMapping("/check")
    Result<Long> checkTokenValid(@Validated(Check.class) @RequestBody Login login);

    /**
     * 注销用户的Token令牌
     *
     * @param login Login
     * @return Result<Boolean>
     */
    @PostMapping("/cancel")
    Result<Boolean> cancelToken(@Validated(Update.class) @RequestBody Login login);
}
