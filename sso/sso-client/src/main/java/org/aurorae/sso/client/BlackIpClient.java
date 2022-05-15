package org.aurorae.sso.client;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Result;
import org.aurorae.common.valid.Insert;
import org.aurorae.common.valid.Update;
import org.aurorae.sso.cover.BlackIpCover;
import org.aurorae.sso.hystrix.BlackIpClientHystrix;
import org.aurorae.sso.model.BlackIp;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import javax.validation.constraints.NotNull;

/**
 * Ip 黑名单 FeignClient
 *
 * @author aurorae
 */
@FeignClient(path = Common.Service.AUTH_BLACK_IP_URL_PREFIX, name = Common.Service.AUTH_SERVICE_NAME, fallbackFactory = BlackIpClientHystrix.class)
public interface BlackIpClient {

    /**
     * 新增 BlackIp
     *
     * @param blackIp BlackIp
     * @return BlackIp
     */
    @PostMapping("/add")
    Result<BlackIp> add(@Validated(Insert.class) @RequestBody BlackIp blackIp);

    /**
     * 根据 ID 删除 BlackIp
     *
     * @param id BlackIp Id
     * @return Boolean
     */
    @PostMapping("/delete/{id}")
    Result<Boolean> delete(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 修改 BlackIp
     * <p>
     * 支  持: Enable
     * 不支持: Ip
     *
     * @param blackIp BlackIp
     * @return BlackIp
     */
    @PostMapping("/update")
    Result<BlackIp> update(@Validated(Update.class) @RequestBody BlackIp blackIp);

    /**
     * 根据 ID 查询 BlackIp
     *
     * @param id BlackIp Id
     * @return BlackIp
     */
    @GetMapping("/id/{id}")
    Result<BlackIp> selectById(@NotNull @PathVariable(value = "id") Long id);

    /**
     * 根据 Ip 查询 BlackIp
     *
     * @param ip Black Ip
     * @return BlackIp
     */
    @GetMapping("/ip/{ip}")
    Result<BlackIp> selectByIp(@NotNull @PathVariable(value = "ip") String ip);

    /**
     * 分页查询 BlackIp
     *
     * @param blackIpDto Dto
     * @return Page<BlackIp>
     */
    @PostMapping("/list")
    Result<Page<BlackIp>> list(@RequestBody(required = false) BlackIpCover blackIpDto);

    /**
     * 检测 Ip 是否在 Ip 黑名单列表
     *
     * @param ip Black Ip
     * @return Boolean
     */
    @GetMapping("/check/{ip}")
    Result<Boolean> checkBlackIpValid(@NotNull @PathVariable(value = "ip") String ip);

}
