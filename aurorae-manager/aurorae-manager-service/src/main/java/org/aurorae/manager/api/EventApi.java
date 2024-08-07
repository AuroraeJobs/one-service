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

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.manager.client.EventClient;
import org.aurorae.manager.document.DeviceEvent;
import org.aurorae.manager.document.DriverEvent;
import org.aurorae.manager.service.EventService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.DeviceEventDto;
import org.aurorae.manager.cover.DriverEventDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_EVENT_URL_PREFIX)
public class EventApi implements EventClient {

    @Resource
    private EventService eventService;

    @Override
    public Result<Page<DriverEvent>> driverEvent(DriverEventDto driverEventDto) {
        try {
            Page<DriverEvent> page = eventService.driverEvent(driverEventDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<DeviceEvent>> deviceEvent(DeviceEventDto deviceEventDto) {
        try {
            Page<DeviceEvent> page = eventService.deviceEvent(deviceEventDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}