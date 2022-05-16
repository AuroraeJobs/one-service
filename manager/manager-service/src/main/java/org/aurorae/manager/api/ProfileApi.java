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
import org.aurorae.manager.client.ProfileClient;
import org.aurorae.manager.service.NotifyService;
import org.aurorae.manager.service.ProfileService;
import org.aurorae.common.util.Result;
import org.aurorae.common.constant.Common;
import org.aurorae.manager.cover.ProfileDto;
import org.aurorae.manager.model.Profile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

/**
 * 模板 Client 接口实现
 *
 * @author pnoker
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.MANAGER_PROFILE_URL_PREFIX)
public class ProfileApi implements ProfileClient {

    @Resource
    private NotifyService notifyService;
    @Resource
    private ProfileService profileService;

    @Override
    public Result<Profile> add(Profile profile, Long tenantId) {
        try {
            Profile add = profileService.add(profile.setTenantId(tenantId));
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
            Profile profile = profileService.selectById(id);
            if (null != profile && profileService.delete(id)) {
                notifyService.notifyDriverProfile(Common.Driver.Profile.DELETE, profile);
                return Result.ok();
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Profile> update(Profile profile, Long tenantId) {
        try {
            Profile update = profileService.update(profile.setTenantId(tenantId));
            if (null != update) {
                notifyService.notifyDriverProfile(Common.Driver.Profile.UPDATE, update);
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Profile> selectById(Long id) {
        try {
            Profile select = profileService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Profile>> selectByDeviceId(Long deviceId) {
        try {
            List<Profile> select = profileService.selectByDeviceId(deviceId);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Page<Profile>> list(ProfileDto profileDto, Long tenantId) {
        try {
            profileDto.setTenantId(tenantId);
            Page<Profile> page = profileService.list(profileDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
