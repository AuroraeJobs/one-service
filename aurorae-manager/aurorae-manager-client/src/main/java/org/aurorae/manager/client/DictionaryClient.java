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

import org.aurorae.manager.hystrix.DictionaryClientHystrix;
import org.aurorae.common.util.Dictionary;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 字典 FeignClient
 *
 * @author pnoker
 */
@FeignClient(path = Common.Service.MANAGER_DICTIONARY_URL_PREFIX, name = Common.Service.MANAGER_SERVICE_NAME, fallbackFactory = DictionaryClientHystrix.class)
public interface DictionaryClient {

    /**
     * 查询驱动 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/driver")
    Result<List<Dictionary>> driverDictionary(@RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 查询驱动属性 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/driver_attribute")
    Result<List<Dictionary>> driverAttributeDictionary(@RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 查询位号属性 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/point_attribute")
    Result<List<Dictionary>> pointAttributeDictionary(@RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 查询模板 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/profile")
    Result<List<Dictionary>> profileDictionary(@RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 查询设备 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/device")
    Result<List<Dictionary>> deviceDictionary(@RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 查询位号 Dictionary
     *
     * @param parent profile/device
     * @return List<Dictionary>
     */
    @GetMapping("/point/{parent}")
    Result<List<Dictionary>> pointDictionary(@NotNull @PathVariable("parent") String parent, @RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
