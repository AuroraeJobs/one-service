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
import org.aurorae.manager.hystrix.PointInfoClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.PointInfoDto;
import org.aurorae.manager.model.PointInfo;
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
 * 位号配置信息 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_POINT_INFO_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = PointInfoClientHystrix.class)
public interface PointInfoClient {

    /**
     * 新增 PointInfo
     *
     * @param pointInfo PointInfo
     * @return PointInfo
     */
    @PostMapping("/add")
    Result<PointInfo> add(@Validated(Insert.class) @RequestBody PointInfo pointInfo);

    /**
     * 根据 ID 删除 PointInfo
     *
     * @param id PointInfo Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 PointInfo
     *
     * @param pointInfo PointInfo
     * @return PointInfo
     */
    @PostMapping("/update")
    Result<PointInfo> update(@Validated(Update.class) @RequestBody PointInfo pointInfo);

    /**
     * 根据 ID 查询 PointInfo
     *
     * @param id PointInfo Id
     * @return PointInfo
     */
    @GetMapping("/id/{id}")
    Result<PointInfo> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 属性ID、设备ID 和 位号ID 查询 PointInfo
     *
     * @param attributeId Attribute Id
     * @param deviceId    Device Id
     * @param pointId     Point Id
     * @return PointInfo
     */
    @GetMapping("/attribute_id/{attributeId}/device_id/{deviceId}/point_id/{pointId}")
    Result<PointInfo> selectByAttributeIdAndDeviceIdAndPointId(@NotNull @PathVariable(value = "attributeId") Long attributeId, @NotNull @PathVariable(value = "deviceId") Long deviceId, @NotNull @PathVariable(value = "pointId") Long pointId);

    /**
     * 根据 设备ID 和 位号ID 查询 PointInfo
     *
     * @param deviceId Device Id
     * @param pointId  Point Id
     * @return PointInfo
     */
    @GetMapping("/device_id/{deviceId}/point_id/{pointId}")
    Result<List<PointInfo>> selectByDeviceIdAndPointId(@NotNull @PathVariable(value = "deviceId") Long deviceId, @NotNull @PathVariable(value = "pointId") Long pointId);

    /**
     * 根据 设备ID 查询 PointInfo
     *
     * @param deviceId Device Id
     * @return PointInfo
     */
    @GetMapping("/device_id/{deviceId}")
    Result<List<PointInfo>> selectByDeviceId(@NotNull @PathVariable(value = "deviceId") Long deviceId);

    /**
     * 分页查询 PointInfo
     *
     * @param pointInfoDto PointInfo Dto
     * @return Page<PointInfo>
     */
    @PostMapping("/list")
    Result<Page<PointInfo>> list(@RequestBody(required = false) PointInfoDto pointInfoDto);

}
