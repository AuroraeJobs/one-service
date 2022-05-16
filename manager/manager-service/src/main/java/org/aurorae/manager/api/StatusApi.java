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

import org.aurorae.manager.client.StatusClient;
import org.aurorae.manager.service.StatusService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DeviceDto;
import org.aurorae.manager.cover.DriverDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.Map;

/**
 * 设备 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_STATUS_URL_PREFIX)
public class StatusApi implements StatusClient {

    @Resource
    private StatusService statusService;

    @Override
    public Result<Map<Long, String>> driverStatus(DriverDto driverDto, Long tenantId) {
        try {
            driverDto.setTenantId(tenantId);
            Map<Long, String> statuses = statusService.driver(driverDto);
            return Result.ok(statuses);
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Map<Long, String>> deviceStatus(DeviceDto deviceDto, Long tenantId) {
        try {
            deviceDto.setTenantId(tenantId);
            Map<Long, String> statuses = statusService.device(deviceDto);
            return Result.ok(statuses);
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Map<Long, String>> deviceStatusByDriverId(Long driverId) {
        try {
            DeviceDto deviceDto = new DeviceDto();
            deviceDto.setDriverId(driverId);
            Map<Long, String> statuses = statusService.device(deviceDto);
            return Result.ok(statuses);
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Map<Long, String>> deviceStatusByProfileId(Long profileId) {
        try {
            Map<Long, String> statuses = statusService.deviceByProfileId(profileId);
            return Result.ok(statuses);
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

}
