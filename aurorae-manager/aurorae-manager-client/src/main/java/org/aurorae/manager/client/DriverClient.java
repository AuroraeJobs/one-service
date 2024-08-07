/*
 * Copyright 2016-2021 Pnoker. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.aurorae.manager.client;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.manager.hystrix.DriverClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DriverDto;
import org.aurorae.manager.model.Driver;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;

/**
 * 驱动 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_DRIVER_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = DriverClientHystrix.class)
public interface DriverClient {

    /**
     * 新增 Driver
     *
     * @param driver Driver
     * @return Driver
     */
    @PostMapping("/add")
    Result<Driver> add(@Validated(Insert.class) @RequestBody Driver driver, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 删除 Driver
     *
     * @param id Driver Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 Driver
     *
     * @param driver Driver
     * @return Driver
     */
    @PostMapping("/update")
    Result<Driver> update(@Validated(Update.class) @RequestBody Driver driver, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 查询 Driver
     *
     * @param id Driver Id
     * @return Driver
     */
    @GetMapping("/id/{id}")
    Result<Driver> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 SERVICENAME 查询 Driver
     *
     * @param serviceName Driver Service Name
     * @return Driver
     */
    @GetMapping("/service/{serviceName}")
    Result<Driver> selectByServiceName(@NotNull @PathVariable(value = "serviceName") String serviceName);

    /**
     * 根据 TYPE & HOST & PORT 查询 Driver
     *
     * @param type Driver type
     * @param host Driver Host
     * @param port Driver Port
     * @return Driver
     */
    @GetMapping("/type/{type}/host/{host}/port/{port}")
    Result<Driver> selectByHostPort(@NotNull @PathVariable(value = "type") String type, @NotNull @PathVariable(value = "host") String host, @NotNull @PathVariable(value = "port") Integer port, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 分页查询 Driver
     *
     * @param driverDto Driver Dto
     * @return Page<Driver>
     */
    @PostMapping("/list")
    Result<Page<Driver>> list(@RequestBody(required = false) DriverDto driverDto, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
