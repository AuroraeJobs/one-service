package org.aurorae.sso.hystrix;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.UserClient;
import org.aurorae.sso.cover.UserCover;
import org.aurorae.sso.model.User;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * UserClientHystrix
 *
 * @author aurorae
 */
@Slf4j
@Component
public class UserClientHystrix implements FallbackFactory<UserClient> {

    @Override
    public UserClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: AURORAE-AUTH" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new UserClient() {

            @Override
            public Result<User> add(User user) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> delete(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<User> update(User user) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> restPassword(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<User> selectById(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<User> selectByName(String name) {
                return Result.fail(message);
            }

            @Override
            public Result<Page<User>> list(UserCover user) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> checkUserValid(String username) {
                return Result.fail(message);
            }
        };
    }

}