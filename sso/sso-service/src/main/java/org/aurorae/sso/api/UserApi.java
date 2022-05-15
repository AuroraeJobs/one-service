package org.aurorae.sso.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.UserClient;
import org.aurorae.sso.cover.UserCover;
import org.aurorae.sso.model.User;
import org.aurorae.sso.service.UserService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 用户 Feign Client 接口实现
 *
 * @author aurorae
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.AUTH_USER_URL_PREFIX)
public class UserApi implements UserClient {

    @Resource
    private UserService userService;

    @Override
    public Result<User> add(User user) {
        try {
            User add = userService.add(user);
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
            return userService.delete(id) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<User> update(User user) {
        try {
            User update = userService.update(user.setName(null));
            if (null != update) {
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<Boolean> restPassword(Long id) {
        try {
            return userService.restPassword(id) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<User> selectById(Long id) {
        try {
            User select = userService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<User> selectByName(String name) {
        try {
            User select = userService.selectByName(name);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<Page<User>> list(UserCover userDto) {
        try {
            Page<User> page = userService.list(userDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<Boolean> checkUserValid(String name) {
        try {
            return userService.checkUserValid(name) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

}
