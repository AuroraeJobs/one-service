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
import org.aurorae.manager.client.PointInfoClient;
import org.aurorae.manager.service.NotifyService;
import org.aurorae.manager.service.PointInfoService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.PointInfoDto;
import org.aurorae.manager.model.PointInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

/**
 * 位号配置信息 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_POINT_INFO_URL_PREFIX)
public class PointInfoApi implements PointInfoClient {

    @Resource
    private PointInfoService pointInfoService;
    @Resource
    private NotifyService notifyService;

    @Override
    public Result<PointInfo> add(PointInfo pointInfo) {
        try {
            PointInfo add = pointInfoService.add(pointInfo);
            if (null != add) {
                notifyService.notifyDriverPointInfo(Common.Driver.PointInfo.ADD, add);
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
            PointInfo pointInfo = pointInfoService.selectById(id);
            if (null != pointInfo && pointInfoService.delete(id)) {
                notifyService.notifyDriverPointInfo(Common.Driver.PointInfo.DELETE, pointInfo);
                return Result.ok();
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<PointInfo> update(PointInfo pointInfo) {
        try {
            PointInfo update = pointInfoService.update(pointInfo);
            if (null != update) {
                notifyService.notifyDriverPointInfo(Common.Driver.PointInfo.UPDATE, update);
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<PointInfo> selectById(Long id) {
        try {
            PointInfo select = pointInfoService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<PointInfo> selectByAttributeIdAndDeviceIdAndPointId(Long attributeId, Long deviceId, Long pointId) {
        try {
            PointInfo select = pointInfoService.selectByAttributeIdAndDeviceIdAndPointId(attributeId, deviceId, pointId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<PointInfo>> selectByDeviceIdAndPointId(Long deviceId, Long pointId) {
        try {
            List<PointInfo> select = pointInfoService.selectByDeviceIdAndPointId(deviceId, pointId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<PointInfo>> selectByDeviceId(Long deviceId) {
        try {
            List<PointInfo> select = pointInfoService.selectByDeviceId(deviceId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<PointInfo>> list(PointInfoDto pointInfoDto) {
        try {
            Page<PointInfo> page = pointInfoService.list(pointInfoDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
