package org.aurorae.sso.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.TenantClient;
import org.aurorae.sso.cover.TenantCover;
import org.aurorae.sso.model.Tenant;
import org.aurorae.sso.service.TenantService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 用户 Feign Client 接口实现
 *
 * @author aurorae
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.AUTH_TENANT_URL_PREFIX)
public class TenantApi implements TenantClient {
    @Resource
    private TenantService tenantService;

    @Override
    public Result<Tenant> add(Tenant tenant) {
        try {
            Tenant add = tenantService.add(tenant);
            if (null != add) {
                return Result.ok(add);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Boolean> delete(Long id) {
        try {
            return tenantService.delete(id) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Tenant> update(Tenant tenant) {
        try {
            Tenant update = tenantService.update(tenant.setName(null));
            if (null != update) {
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Tenant> selectById(Long id) {
        try {
            Tenant select = tenantService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<Tenant> selectByName(String name) {
        try {
            Tenant select = tenantService.selectByName(name);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<Page<Tenant>> list(TenantCover tenantDto) {
        try {
            Page<Tenant> page = tenantService.list(tenantDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

}
