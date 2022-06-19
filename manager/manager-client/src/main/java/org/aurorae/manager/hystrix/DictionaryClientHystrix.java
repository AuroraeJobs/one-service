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

package org.aurorae.manager.hystrix;

import org.aurorae.manager.client.DictionaryClient;
import org.aurorae.common.util.Dictionary;
import org.aurorae.common.util.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * DictionaryClientHystrix
 *
 * @author pnoker
 */
@Slf4j
@Component("Manager_DictionaryClientHystrix")
public class DictionaryClientHystrix implements FallbackFactory<DictionaryClient> {

    @Override
    public DictionaryClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: MANAGER" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new DictionaryClient() {

            @Override
            public Result<List<Dictionary>> driverDictionary(Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Dictionary>> driverAttributeDictionary(Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Dictionary>> pointAttributeDictionary(Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Dictionary>> profileDictionary(Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Dictionary>> deviceDictionary(Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Dictionary>> pointDictionary(String parent, Long tenantId) {
                return Result.fail(message);
            }
        };
    }
}