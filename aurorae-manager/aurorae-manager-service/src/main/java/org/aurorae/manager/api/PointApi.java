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
import org.aurorae.manager.client.PointClient;
import org.aurorae.manager.service.NotifyService;
import org.aurorae.manager.service.PointService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.PointDto;
import org.aurorae.manager.model.Point;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 位号 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_POINT_URL_PREFIX)
public class PointApi implements PointClient {

    @Resource
    private PointService pointService;
    @Resource
    private NotifyService notifyService;

    @Override
    public Result<Point> add(Point point, Long tenantId) {
        try {
            Point add = pointService.add(point.setTenantId(tenantId));
            if (null != add) {
                notifyService.notifyDriverPoint(Common.Driver.Point.ADD, add);
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
            Point point = pointService.selectById(id);
            if (null != point && pointService.delete(id)) {
                notifyService.notifyDriverPoint(Common.Driver.Point.DELETE, point);
                return Result.ok();
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Point> update(Point point, Long tenantId) {
        try {
            Point update = pointService.update(point.setTenantId(tenantId));
            if (null != update) {
                notifyService.notifyDriverPoint(Common.Driver.Point.UPDATE, update);
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Point> selectById(Long id) {
        try {
            Point select = pointService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Point>> selectByProfileId(Long profileId) {
        try {
            List<Point> select = pointService.selectByProfileId(profileId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Point>> selectByDeviceId(Long deviceId) {
        try {
            List<Point> select = pointService.selectByDeviceId(deviceId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<Point>> list(PointDto pointDto, Long tenantId) {
        try {
            pointDto.setTenantId(tenantId);
            Page<Point> page = pointService.list(pointDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Map<Long, String>> unit(Set<Long> pointIds) {
        try {
            Map<Long, String> units = pointService.unit(pointIds);
            if (null != units) {
                return Result.ok(units);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
