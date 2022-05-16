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
import org.aurorae.manager.hystrix.LabelClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.LabelDto;
import org.aurorae.manager.model.Label;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;

/**
 * 标签 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_LABEL_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = LabelClientHystrix.class)
public interface LabelClient {

    /**
     * 新增 Label
     *
     * @param label Label
     * @return Label
     */
    @PostMapping("/add")
    Result<Label> add(@Validated(Insert.class) @RequestBody Label label, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 删除 Label
     *
     * @param id Label Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 Label
     *
     * @param label Label
     * @return Label
     */
    @PostMapping("/update")
    Result<Label> update(@Validated(Update.class) @RequestBody Label label, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 根据 ID 查询 Label
     *
     * @param id Label Id
     * @return Label
     */
    @GetMapping("/id/{id}")
    Result<Label> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 分页查询 Label
     *
     * @param labelDto Label Dto
     * @return Page<Label>
     */
    @PostMapping("/list")
    Result<Page<Label>> list(@RequestBody(required = false) LabelDto labelDto, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
