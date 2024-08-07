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

package org.aurorae.manager.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.manager.service.DeviceService;
import org.aurorae.manager.service.DriverService;
import org.aurorae.manager.service.ProfileBindService;
import org.aurorae.manager.service.StatusService;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DeviceDto;
import org.aurorae.manager.cover.DriverDto;
import org.aurorae.manager.model.Device;
import org.aurorae.manager.model.Driver;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.util.RedisUtil;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

/**
 * DeviceService Impl
 *
 * @author pnoker
 */
@Slf4j
@Service
public class StatusServiceImpl implements StatusService {

    @Resource
    private RedisUtil redisUtil;
    @Resource
    private DriverService driverService;
    @Resource
    private DeviceService deviceService;
    @Resource
    private ProfileBindService profileBindService;

    @Override
    public String driver(String serviceName) {
        String key = Common.Cache.DRIVER_STATUS_KEY_PREFIX + serviceName;
        String status = redisUtil.getKey(key, String.class);
        status = null != status ? status : Common.Driver.Status.OFFLINE;
        return status;
    }

    @Override
    public Map<Long, String> driver(DriverDto driverDto) {
        Map<Long, String> statusMap = new HashMap<>(16);

        Page<Driver> page = driverService.list(driverDto);
        page.getRecords().forEach(driver -> {
            String key = Common.Cache.DRIVER_STATUS_KEY_PREFIX + driver.getServiceName();
            String status = redisUtil.getKey(key, String.class);
            status = null != status ? status : Common.Driver.Status.OFFLINE;
            statusMap.put(driver.getId(), status);
        });
        return statusMap;
    }

    @Override
    public String device(Long id) {
        String key = Common.Cache.DEVICE_STATUS_KEY_PREFIX + id;
        String status = redisUtil.getKey(key, String.class);
        status = null != status ? status : Common.Driver.Status.OFFLINE;
        return status;
    }

    @Override
    public Map<Long, String> device(DeviceDto deviceDto) {
        Map<Long, String> statusMap = new HashMap<>(16);

        Page<Device> page = deviceService.list(deviceDto);
        page.getRecords().forEach(device -> {
            String key = Common.Cache.DEVICE_STATUS_KEY_PREFIX + device.getId();
            String status = redisUtil.getKey(key, String.class);
            status = null != status ? status : Common.Driver.Status.OFFLINE;
            statusMap.put(device.getId(), status);
        });
        return statusMap;
    }

    @Override
    public Map<Long, String> deviceByProfileId(Long profileId) {
        Map<Long, String> statusMap = new HashMap<>(16);

        profileBindService.selectDeviceIdByProfileId(profileId).forEach(id -> {
            String key = Common.Cache.DEVICE_STATUS_KEY_PREFIX + id;
            String status = redisUtil.getKey(key, String.class);
            status = null != status ? status : Common.Driver.Status.OFFLINE;
            statusMap.put(id, status);
        });
        return statusMap;
    }

}
