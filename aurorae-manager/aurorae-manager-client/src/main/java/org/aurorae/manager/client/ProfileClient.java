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
import org.aurorae.manager.hystrix.ProfileClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.ProfileDto;
import org.aurorae.manager.model.Profile;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 模板 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_PROFILE_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = ProfileClientHystrix.class)
public interface ProfileClient {

    /**
     * 新增 Profile
     *
     * @param profile Profile
     * @return Profile
     */
    @PostMapping("/add")
    Result<Profile> add(@Validated(Insert.class) @RequestBody Profile profile, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 删除 Profile
     *
     * @param id profile Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 Profile
     *
     * @param profile Profile
     * @return Profile
     */
    @PostMapping("/update")
    Result<Profile> update(@Validated(Update.class) @RequestBody Profile profile, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 查询 Profile
     *
     * @param id Profile Id
     * @return Profile
     */
    @GetMapping("/id/{id}")
    Result<Profile> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 设备 ID 查询 Profile 集合
     *
     * @param deviceId Device Id
     * @return Profile Array
     */
    @GetMapping("/device_id/{deviceId}")
    Result<List<Profile>> selectByDeviceId(@NotNull @PathVariable(value = "deviceId") Long deviceId);

    /**
     * 分页查询 Profile
     *
     * @param profileDto Profile Dto
     * @return Page<Profile>
     */
    @PostMapping("/list")
    Result<Page<Profile>> list(@RequestBody(required = false) ProfileDto profileDto, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
