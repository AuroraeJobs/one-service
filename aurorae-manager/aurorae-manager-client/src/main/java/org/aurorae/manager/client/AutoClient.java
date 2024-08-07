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

import org.aurorae.manager.hystrix.AutoClientHystrix;
import org.aurorae.common.util.Result;
import org.aurorae.common.valid.Insert;
import org.aurorae.manager.point.PointDetail;
import org.aurorae.common.constant.Common;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

/**
 * 自发现 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_AUTO_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = AutoClientHystrix.class)
public interface AutoClient {

    @PostMapping("/create_device_point")
    Result<PointDetail> autoCreateDeviceAndPoint(@Validated(Insert.class) @RequestBody PointDetail pointDetail, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
