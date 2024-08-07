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

package org.aurorae.manager.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.manager.client.DriverClient;
import org.aurorae.manager.service.DriverService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DriverDto;
import org.aurorae.manager.model.Driver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 驱动 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_DRIVER_URL_PREFIX)
public class DriverApi implements DriverClient {
    @Resource
    private DriverService driverService;

    @Override
    public Result<Driver> add(Driver driver, Long tenantId) {
        try {
            Driver add = driverService.add(driver.setTenantId(tenantId));
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
            return driverService.delete(id) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Driver> update(Driver driver, Long tenantId) {
        try {
            Driver update = driverService.update(driver.setTenantId(tenantId));
            if (null != update) {
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Driver> selectById(Long id) {
        try {
            Driver select = driverService.selectById(id);
            return Result.ok(select);
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Driver> selectByServiceName(String serviceName) {
        try {
            Driver select = driverService.selectByServiceName(serviceName);
            return Result.ok(select);
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Driver> selectByHostPort(String type, String host, Integer port, Long tenantId) {
        try {
            Driver select = driverService.selectByHostPort(type, host, port, tenantId);
            return Result.ok(select);
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Page<Driver>> list(DriverDto driverDto, Long tenantId) {
        try {
            driverDto.setTenantId(tenantId);
            Page<Driver> page = driverService.list(driverDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
