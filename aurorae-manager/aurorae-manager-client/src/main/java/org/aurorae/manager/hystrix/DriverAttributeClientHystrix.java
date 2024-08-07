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

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.manager.client.DriverAttributeClient;
import org.aurorae.common.util.Result;
import org.aurorae.manager.cover.DriverAttributeDto;
import org.aurorae.manager.model.DriverAttribute;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * DriverAttributeClient
 *
 * @author pnoker
 */
@Slf4j
@Component
public class DriverAttributeClientHystrix implements FallbackFactory<DriverAttributeClient> {

    @Override
    public DriverAttributeClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: DC3-MANAGER" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new DriverAttributeClient() {

            @Override
            public Result<DriverAttribute> add(DriverAttribute driverAttribute) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> delete(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<DriverAttribute> update(DriverAttribute driverAttribute) {
                return Result.fail(message);
            }

            @Override
            public Result<DriverAttribute> selectById(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<List<DriverAttribute>> selectByDriverId(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<Page<DriverAttribute>> list(DriverAttributeDto driverAttributeDto) {
                return Result.fail(message);
            }

        };
    }
}