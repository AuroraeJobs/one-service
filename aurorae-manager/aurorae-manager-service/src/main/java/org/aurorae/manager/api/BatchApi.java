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

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson.JSON;
import org.aurorae.manager.client.BatchClient;
import org.aurorae.common.util.Utils;
import org.aurorae.manager.service.BatchService;
import org.aurorae.common.util.Result;
import org.aurorae.manager.batch.BatchDriver;
import org.aurorae.common.constant.Common;
import org.aurorae.common.exception.ServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.util.List;

/**
 * 批量导入 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_BATCH_URL_PREFIX)
public class BatchApi implements BatchClient {

    @Resource
    private BatchService batchService;


    @Override
    public Result<Boolean> batchImport(MultipartFile multipartFile) {
        try {
            if (multipartFile.isEmpty()) {
                throw new ServiceException("Import file is empty");
            }
            // Convert json file to BatchDriver Array
            List<BatchDriver> batchDrivers = JSON.parseArray(
                    Utils.inputStreamToString(multipartFile.getInputStream()),
                    BatchDriver.class
            );
            if (null == batchDrivers) {
                throw new ServiceException("Import file is blank");
            }
            batchService.batchImport(batchDrivers);
            return Result.ok();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<Boolean> batchImport(List<BatchDriver> batchDrivers) {
        try {
            if (null == batchDrivers) {
                throw new ServiceException("Import file is blank");
            }
            batchService.batchImport(batchDrivers);
            return Result.ok();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<BatchDriver> batchExport(String serviceName) {
        try {
            if (StrUtil.hasBlank(serviceName)) {
                throw new ServiceException("Export driver service name is blank");
            }
            BatchDriver batchDriver = batchService.batchExport(serviceName);
            if (null != batchDriver) {
                return Result.ok(batchDriver);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
