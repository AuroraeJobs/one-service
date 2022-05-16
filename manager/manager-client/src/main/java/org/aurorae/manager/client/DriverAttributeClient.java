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
import org.aurorae.manager.hystrix.DriverAttributeClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DriverAttributeDto;
import org.aurorae.manager.model.DriverAttribute;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 驱动配置属性 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_DRIVER_ATTRIBUTE_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = DriverAttributeClientHystrix.class)
public interface DriverAttributeClient {

    /**
     * 新增 DriverAttribute
     *
     * @param driverAttribute DriverAttribute
     * @return DriverAttribute
     */
    @PostMapping("/add")
    Result<DriverAttribute> add(@Validated(Insert.class) @RequestBody DriverAttribute driverAttribute);

    /**
     * 根据 ID 删除 DriverAttribute
     *
     * @param id DriverAttributeId
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 DriverAttribute
     *
     * @param driverAttribute DriverAttribute
     * @return DriverAttribute
     */
    @PostMapping("/update")
    Result<DriverAttribute> update(@Validated(Update.class) @RequestBody DriverAttribute driverAttribute);

    /**
     * 根据 ID 查询 DriverAttribute
     *
     * @param id DriverAttribute Id
     * @return DriverAttribute
     */
    @GetMapping("/id/{id}")
    Result<DriverAttribute> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 驱动ID 查询 DriverAttribute
     *
     * @param id DriverAttribute Id
     * @return DriverAttribute
     */
    @GetMapping("/driver_id/{id}")
    Result<List<DriverAttribute>> selectByDriverId(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 分页查询 DriverAttribute
     *
     * @param driverAttributeDto DriverAttribute Dto
     * @return Page<DriverAttribute>
     */
    @PostMapping("/list")
    Result<Page<DriverAttribute>> list(@RequestBody(required = false) DriverAttributeDto driverAttributeDto);

}
