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
import org.aurorae.manager.hystrix.GroupClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.GroupDto;
import org.aurorae.manager.model.Group;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;

/**
 * 分组 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_GROUP_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = GroupClientHystrix.class)
public interface GroupClient {

    /**
     * 新增 Group
     *
     * @param group Group
     * @return Group
     */
    @PostMapping("/add")
    Result<Group> add(@Validated(Insert.class) @RequestBody Group group, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 删除 Group
     *
     * @param id Group Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 Group
     *
     * @param group Group
     * @return Group
     */
    @PostMapping("/update")
    Result<Group> update(@Validated(Update.class) @RequestBody Group group, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 查询 Group
     *
     * @param id Group Id
     * @return Group
     */
    @GetMapping("/id/{id}")
    Result<Group> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 分页查询 Group
     *
     * @param groupDto Group Dto
     * @return Page<Group>
     */
    @PostMapping("/list")
    Result<Page<Group>> list(@RequestBody(required = false) GroupDto groupDto, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
