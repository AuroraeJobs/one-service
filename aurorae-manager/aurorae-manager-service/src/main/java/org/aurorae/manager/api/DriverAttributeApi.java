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
import org.aurorae.manager.client.DriverAttributeClient;
import org.aurorae.manager.service.DriverAttributeService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DriverAttributeDto;
import org.aurorae.common.exception.NotFoundException;
import org.aurorae.manager.model.DriverAttribute;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * 驱动连接配置信息 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_DRIVER_ATTRIBUTE_URL_PREFIX)
public class DriverAttributeApi implements DriverAttributeClient {
    @Resource
    private DriverAttributeService driverAttributeService;

    @Override
    public Result<DriverAttribute> add(DriverAttribute driverAttribute) {
        try {
            DriverAttribute add = driverAttributeService.add(driverAttribute);
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
            return driverAttributeService.delete(id) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<DriverAttribute> update(DriverAttribute driverAttribute) {
        try {
            DriverAttribute update = driverAttributeService.update(driverAttribute);
            if (null != update) {
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<DriverAttribute> selectById(Long id) {
        try {
            DriverAttribute select = driverAttributeService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<DriverAttribute>> selectByDriverId(Long id) {
        try {
            List<DriverAttribute> select = driverAttributeService.selectByDriverId(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (NotFoundException ne) {
            return Result.ok(new ArrayList<>());
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<DriverAttribute>> list(DriverAttributeDto driverAttributeDto) {
        try {
            Page<DriverAttribute> page = driverAttributeService.list(driverAttributeDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
