package org.aurorae.sso.client;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Result;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.aurorae.sso.cover.UserCover;
import org.aurorae.sso.hystrix.UserClientHystrix;
import org.aurorae.sso.model.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import javax.validation.constraints.NotNull;

/**
 * 用户 FeignClient
 *
 * @author aurorae
 */
@FeignClient(path = Common.Service.AUTH_USER_URL_PREFIX, name = Common.Service.AUTH_SERVICE_NAME, fallbackFactory = UserClientHystrix.class)
public interface UserClient {

    /**
     * 新增 User
     *
     * @param user User
     * @return User
     */
    @PostMapping("/add")
    Result<User> add(@Validated(Insert.class) @RequestBody User user);

    /**
     * 根据 ID 删除 User
     *
     * @param id User Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 User
     * <p>
     * 支  持: Enable,Password
     * 不支持: Name
     *
     * @param user User
     * @return User
     */
    @PostMapping("/update")
    Result<User> update(@Validated(Update.class) @RequestBody User user);

    /**
     * 根据 ID 重置 User 密码
     *
     * @param id User Id
     * @return Boolean
     */
    @PostMapping("/reset/{id}")
    Result<Boolean> restPassword(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 ID 查询 User
     *
     * @param id User Id
     * @return User
     */
    @GetMapping("/id/{id}")
    Result<User> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 Name 查询 User
     *
     * @param name User Name
     * @return User
     */
    @GetMapping("/name/{name}")
    Result<User> selectByName(@NotNull @PathVariable(value = "name") String name);

    /**
     * 分页查询 User
     *
     * @param user cover
     * @return Page<User>
     */
    @PostMapping("/list")
    Result<Page<User>> list(@RequestBody(required = false) UserCover user);

    /**
     * 检测用户是否存在
     *
     * @param name User Name
     * @return Boolean
     */
    @GetMapping("/check/{name}")
    Result<Boolean> checkUserValid(@NotNull @PathVariable(value = "name") String name);

}
