package org.aurorae.sso.hystrix;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.BlackIpClient;
import org.aurorae.sso.cover.BlackIpCover;
import org.aurorae.sso.model.BlackIp;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * BlackIpClientHystrix
 *
 * @author aurorae
 */
@Slf4j
@Component
public class BlackIpClientHystrix implements FallbackFactory<BlackIpClient> {

    @Override
    public BlackIpClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: AUTH" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new BlackIpClient() {

            @Override
            public Result<BlackIp> add(BlackIp blackIp) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> delete(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<BlackIp> update(BlackIp blackIp) {
                return Result.fail(message);
            }

            @Override
            public Result<BlackIp> selectById(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<BlackIp> selectByIp(String ip) {
                return Result.fail(message);
            }

            @Override
            public Result<Page<BlackIp>> list(BlackIpCover blackIpDto) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> checkBlackIpValid(String ip) {
                return Result.fail(message);
            }
        };
    }
}