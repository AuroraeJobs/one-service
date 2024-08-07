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
import org.aurorae.manager.client.PointAttributeClient;
import org.aurorae.common.exception.NotFoundException;
import org.aurorae.manager.service.PointAttributeService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.PointAttributeDto;
import org.aurorae.manager.model.PointAttribute;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * 驱动属性配置信息 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_POINT_ATTRIBUTE_URL_PREFIX)
public class PointAttributeApi implements PointAttributeClient {
    @Resource
    private PointAttributeService pointAttributeService;

    @Override
    public Result<PointAttribute> add(PointAttribute pointAttribute) {
        try {
            PointAttribute add = pointAttributeService.add(pointAttribute);
            if (null != add) {
                return Result.ok(add);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Boolean> delete(Long id) {
        try {
            return pointAttributeService.delete(id) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<PointAttribute> update(PointAttribute pointAttribute) {
        try {
            PointAttribute update = pointAttributeService.update(pointAttribute);
            if (null != update) {
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<PointAttribute> selectById(Long id) {
        try {
            PointAttribute select = pointAttributeService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<PointAttribute>> selectByDriverId(Long id) {
        try {
            List<PointAttribute> select = pointAttributeService.selectByDriverId(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (NotFoundException ne) {
            return Result.ok(new ArrayList<>());
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<PointAttribute>> list(PointAttributeDto pointAttributeDto) {
        try {
            Page<PointAttribute> page = pointAttributeService.list(pointAttributeDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
