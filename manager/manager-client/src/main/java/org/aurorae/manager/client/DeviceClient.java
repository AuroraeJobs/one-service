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
import org.aurorae.manager.hystrix.DeviceClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DeviceDto;
import org.aurorae.manager.model.Device;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 设备 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_DEVICE_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = DeviceClientHystrix.class)
public interface DeviceClient {

    /**
     * 新增 Device
     *
     * @param device Device
     * @return Result<Device>
     */
    @PostMapping("/add")
    Result<Device> add(@Validated(Insert.class) @RequestBody Device device, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 删除 Device
     *
     * @param id Device Id
     * @return Result<Boolean>
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 Device
     *
     * @param device Device
     * @return Result<Device>
     */
    @PostMapping("/update")
    Result<Device> update(@Validated(Update.class) @RequestBody Device device, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 查询 Device
     *
     * @param id Device Id
     * @return Result<Device>
     */
    @GetMapping("/id/{id}")
    Result<Device> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 驱动ID 查询 Device
     *
     * @param driverId Driver Id
     * @return Result<Device>
     */
    @GetMapping("/driver_id/{driverId}")
    Result<List<Device>> selectByDriverId(@NotNull @PathVariable(value = "driverId") Long driverId);

    /**
     * 根据 模板ID 查询 Device
     *
     * @param profileId Profile Id
     * @return Result<Device>
     */
    @GetMapping("/profile_id/{profileId}")
    Result<List<Device>> selectByProfileId(@NotNull @PathVariable(value = "profileId") Long profileId);

    /**
     * 分页查询 Device
     *
     * @param deviceDto Device Dto
     * @return Result<Page < Device>>
     */
    @PostMapping("/list")
    Result<Page<Device>> list(@RequestBody(required = false) DeviceDto deviceDto, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
