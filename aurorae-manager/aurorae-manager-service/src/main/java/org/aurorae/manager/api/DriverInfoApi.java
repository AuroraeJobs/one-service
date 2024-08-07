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
import org.aurorae.manager.client.DriverInfoClient;
import org.aurorae.manager.service.DriverInfoService;
import org.aurorae.manager.service.NotifyService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DriverInfoDto;
import org.aurorae.manager.model.DriverInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

/**
 * 位号配置信息 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_DRIVER_INFO_URL_PREFIX)
public class DriverInfoApi implements DriverInfoClient {

    @Resource
    private DriverInfoService driverInfoService;
    @Resource
    private NotifyService notifyService;

    @Override
    public Result<DriverInfo> add(DriverInfo driverInfo) {
        try {
            DriverInfo add = driverInfoService.add(driverInfo);
            if (null != add) {
                notifyService.notifyDriverDriverInfo(Common.Driver.DriverInfo.ADD, add);
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
            DriverInfo driverInfo = driverInfoService.selectById(id);
            if (null != driverInfo && driverInfoService.delete(id)) {
                notifyService.notifyDriverDriverInfo(Common.Driver.DriverInfo.DELETE, driverInfo);
                return Result.ok();
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<DriverInfo> update(DriverInfo driverInfo) {
        try {
            DriverInfo update = driverInfoService.update(driverInfo);
            if (null != update) {
                notifyService.notifyDriverDriverInfo(Common.Driver.DriverInfo.UPDATE, update);
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<DriverInfo> selectById(Long id) {
        try {
            DriverInfo select = driverInfoService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<DriverInfo> selectByAttributeIdAndDeviceId(Long attributeId, Long deviceId) {
        try {
            DriverInfo select = driverInfoService.selectByAttributeIdAndDeviceId(attributeId, deviceId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<DriverInfo>> selectByDeviceId(Long deviceId) {
        try {
            List<DriverInfo> select = driverInfoService.selectByDeviceId(deviceId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<DriverInfo>> list(DriverInfoDto driverInfoDto) {
        try {
            Page<DriverInfo> page = driverInfoService.list(driverInfoDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
