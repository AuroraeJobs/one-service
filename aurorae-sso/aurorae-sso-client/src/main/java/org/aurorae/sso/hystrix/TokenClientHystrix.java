package org.aurorae.sso.hystrix;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.Login;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.TokenClient;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * TokenClientHystrix
 *
 * @author aurorae
 */
@Slf4j
@Component
public class TokenClientHystrix implements FallbackFactory<TokenClient> {

    @Override
    public TokenClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: AUTH" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new TokenClient() {

            @Override
            public Result<String> generateSalt(Login login) {
                return Result.fail(message);
            }

            @Override
            public Result<String> generateToken(Login login) {
                return Result.fail(message);
            }

            @Override
            public Result<Long> checkTokenValid(Login login) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> cancelToken(Login login) {
                return Result.fail(message);
            }

        };
    }
}