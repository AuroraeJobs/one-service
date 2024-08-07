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

import org.aurorae.manager.hystrix.StatusClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DeviceDto;
import org.aurorae.manager.cover.DriverDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;
import java.util.Map;

/**
 * 设备 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_STATUS_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = StatusClientHystrix.class)
public interface StatusClient {

    /**
     * 查询 Driver 服务状态
     * ONLINE, OFFLINE
     *
     * @param driverDto Driver Dto
     * @return Map<Long, String>
     */
    @PostMapping("/driver")
    Result<Map<Long, String>> driverStatus(@RequestBody(required = false) DriverDto driverDto, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 查询 Device 服务状态
     * ONLINE, OFFLINE, MAINTAIN, FAULT
     *
     * @param deviceDto Device Dto
     * @return Map<Long, String>
     */
    @PostMapping("/device")
    Result<Map<Long, String>> deviceStatus(@RequestBody(required = false) DeviceDto deviceDto, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 驱动ID 查询 Device 服务状态
     * ONLINE, OFFLINE, MAINTAIN, FAULT
     *
     * @param driverId Driver Id
     * @return Map<Long, String>
     */
    @GetMapping("/device/driver_id/{driverId}")
    Result<Map<Long, String>> deviceStatusByDriverId(@NotNull @PathVariable(value = "driverId") Long driverId);

    /**
     * 根据 模板ID 查询 Device 服务状态
     * ONLINE, OFFLINE, MAINTAIN, FAULT
     *
     * @param profileId Profile Id
     * @return Map<Long, String>
     */
    @GetMapping("/device/profile_id/{profileId}")
    Result<Map<Long, String>> deviceStatusByProfileId(@NotNull @PathVariable(value = "profileId") Long profileId);

}
