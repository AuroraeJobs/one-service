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

import org.aurorae.manager.client.AutoClient;
import org.aurorae.common.util.Result;
import org.aurorae.manager.point.PointDetail;
import org.aurorae.manager.service.AutoService;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 自发现 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_AUTO_URL_PREFIX)
public class AutoApi implements AutoClient {

    @Resource
    private AutoService autoService;


    @Override
    public Result<PointDetail> autoCreateDeviceAndPoint(PointDetail pointDetail, Long tenantId) {
        try {
            PointDetail createDeviceAndPoint = autoService.autoCreateDeviceAndPointDriver(pointDetail.getDeviceName(), pointDetail.getPointName(), pointDetail.getDriverId(), tenantId);
            if (null != createDeviceAndPoint) {
                return Result.ok(createDeviceAndPoint);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }
}
