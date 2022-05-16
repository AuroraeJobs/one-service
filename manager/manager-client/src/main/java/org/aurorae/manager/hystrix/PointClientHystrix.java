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
import org.aurorae.manager.client.PointClient;
import org.aurorae.common.util.Result;
import org.aurorae.manager.cover.PointDto;
import org.aurorae.manager.model.Point;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * PointClientHystrix
 *
 * @author pnoker
 */
@Slf4j
@Component
public class PointClientHystrix implements FallbackFactory<PointClient> {

    @Override
    public PointClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: DC3-MANAGER" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new PointClient() {

            @Override
            public Result<Point> add(Point point, Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> delete(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<Point> update(Point point, Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<Point> selectById(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Point>> selectByDeviceId(Long deviceId) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Point>> selectByProfileId(Long profileId) {
                return Result.fail(message);
            }

            @Override
            public Result<Page<Point>> list(PointDto pointDto, Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<Map<Long, String>> unit(Set<Long> pointIds) {
                return Result.fail(message);
            }

        };
    }
}