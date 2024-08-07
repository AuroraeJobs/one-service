package org.aurorae.sso.hystrix;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.TenantClient;
import org.aurorae.sso.cover.TenantCover;
import org.aurorae.sso.model.Tenant;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * TenantClientHystrix
 *
 * @author aurorae
 */
@Slf4j
@Component
public class TenantClientHystrix implements FallbackFactory<TenantClient> {

    @Override
    public TenantClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: AUTH" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new TenantClient() {

            @Override
            public Result<Tenant> add(Tenant user) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> delete(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<Tenant> update(Tenant user) {
                return Result.fail(message);
            }

            @Override
            public Result<Tenant> selectById(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<Tenant> selectByName(String name) {
                return Result.fail(message);
            }

            @Override
            public Result<Page<Tenant>> list(TenantCover userDto) {
                return Result.fail(message);
            }
        };
    }
}