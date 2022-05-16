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
import org.aurorae.manager.hystrix.EventClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DeviceEventDto;
import org.aurorae.manager.cover.DriverEventDto;
import org.aurorae.manager.document.DeviceEvent;
import org.aurorae.manager.document.DriverEvent;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * 数据 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_EVENT_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = EventClientHystrix.class)
public interface EventClient {

    /**
     * 分页查询 DriverEvent
     *
     * @param driverEventDto DriverEventDto
     * @return Page<DriverEvent>
     */
    @PostMapping("/driver")
    Result<Page<DriverEvent>> driverEvent(@RequestBody(required = false) DriverEventDto driverEventDto);

    /**
     * 分页查询 DeviceEvent
     *
     * @param deviceEventDto DeviceEventDto
     * @return Page<DeviceEvent>
     */
    @PostMapping("/device")
    Result<Page<DeviceEvent>> deviceEvent(@RequestBody(required = false) DeviceEventDto deviceEventDto);
}
