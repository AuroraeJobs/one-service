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
import org.aurorae.manager.client.DeviceClient;
import org.aurorae.manager.service.DeviceService;
import org.aurorae.manager.service.NotifyService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DeviceDto;
import org.aurorae.manager.model.Device;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

/**
 * 设备 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_DEVICE_URL_PREFIX)
public class DeviceApi implements DeviceClient {

    @Resource
    private DeviceService deviceService;
    @Resource
    private NotifyService notifyService;

    @Override
    public Result<Device> add(Device device, Long tenantId) {
        try {
            Device add = deviceService.add(device.setTenantId(tenantId));
            if (null != add) {
                notifyService.notifyDriverDevice(Common.Driver.Device.ADD, add);
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
            Device device = deviceService.selectById(id);
            if (null != device && deviceService.delete(id)) {
                notifyService.notifyDriverDevice(Common.Driver.Device.DELETE, device);
                return Result.ok();
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Device> update(Device device, Long tenantId) {
        try {
            Device update = deviceService.update(device.setTenantId(tenantId));
            if (null != update) {
                notifyService.notifyDriverDevice(Common.Driver.Device.UPDATE, update);
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Device> selectById(Long id) {
        try {
            Device select = deviceService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Device>> selectByDriverId(Long driverId) {
        try {
            List<Device> select = deviceService.selectByDriverId(driverId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Device>> selectByProfileId(Long profileId) {
        try {
            List<Device> select = deviceService.selectByProfileId(profileId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<Device>> list(DeviceDto deviceDto, Long tenantId) {
        try {
            deviceDto.setTenantId(tenantId);
            Page<Device> page = deviceService.list(deviceDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
