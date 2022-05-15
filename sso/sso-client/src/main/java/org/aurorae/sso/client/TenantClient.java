package org.aurorae.sso.client;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Result;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.aurorae.sso.cover.TenantCover;
import org.aurorae.sso.hystrix.TenantClientHystrix;
import org.aurorae.sso.model.Tenant;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import javax.validation.constraints.NotNull;

/**
 * 租户 FeignClient
 *
 * @author aurorae
 */
@FeignClient(path = Common.Service.AUTH_TENANT_URL_PREFIX, name = Common.Service.AUTH_SERVICE_NAME, fallbackFactory = TenantClientHystrix.class)
public interface TenantClient {

    /**
     * 新增 Tenant
     *
     * @param tenant Tenant
     * @return Tenant
     */
    @PostMapping("/add")
    Result<Tenant> add(@Validated(Insert.class) @RequestBody Tenant tenant);

    /**
     * 根据 ID 删除 Tenant
     *
     * @param id Tenant Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 Tenant
     * <p>
     * 支  持: Enable
     * 不支持: Name
     *
     * @param tenant Tenant
     * @return Tenant
     */
    @PostMapping("/update")
    Result<Tenant> update(@Validated(Update.class) @RequestBody Tenant tenant);

    /**
     * 根据 ID 查询 Tenant
     *
     * @param id Tenant Id
     * @return Tenant
     */
    @GetMapping("/id/{id}")
    Result<Tenant> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 Name 查询 Tenant
     *
     * @param name Tenant Name
     * @return Tenant
     */
    @GetMapping("/name/{name}")
    Result<Tenant> selectByName(@NotNull @PathVariable(value = "name") String name);

    /**
     * 分页查询 Tenant
     *
     * @param tenantDto Dto
     * @return Page<Tenant>
     */
    @PostMapping("/list")
    Result<Page<Tenant>> list(@RequestBody(required = false) TenantCover tenantDto);

}
