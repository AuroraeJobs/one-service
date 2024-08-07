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
import org.aurorae.manager.client.LabelClient;
import org.aurorae.common.util.Result;
import org.aurorae.manager.cover.LabelDto;
import org.aurorae.manager.model.Label;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * LabelClientHystrix
 *
 * @author pnoker
 */
@Slf4j
@Component
public class LabelClientHystrix implements FallbackFactory<LabelClient> {

    @Override
    public LabelClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: DC3-MANAGER" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new LabelClient() {

            @Override
            public Result<Label> add(Label label, Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<Boolean> delete(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<Label> update(Label label, Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<Label> selectById(Long id) {
                return Result.fail(message);
            }

            @Override
            public Result<Page<Label>> list(LabelDto labelDto, Long tenantId) {
                return Result.fail(message);
            }
        };
    }
}