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

import org.aurorae.manager.client.DictionaryClient;
import org.aurorae.common.util.Dictionary;
import org.aurorae.manager.service.DictionaryService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

/**
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_DICTIONARY_URL_PREFIX)
public class DictionaryApi implements DictionaryClient {

    @Resource
    private DictionaryService dictionaryService;

    @Override
    public Result<List<Dictionary>> driverDictionary(Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.driverDictionary(tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Dictionary>> driverAttributeDictionary(Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.driverAttributeDictionary(tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Dictionary>> pointAttributeDictionary(Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.pointAttributeDictionary(tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Dictionary>> profileDictionary(Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.profileDictionary(tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Dictionary>> deviceDictionary(Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.deviceDictionary(tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Dictionary>> pointDictionary(String parent, Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.pointDictionary(parent, tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }
}
