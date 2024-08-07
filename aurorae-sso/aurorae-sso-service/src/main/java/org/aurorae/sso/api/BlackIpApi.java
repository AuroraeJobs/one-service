package org.aurorae.sso.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.BlackIpClient;
import org.aurorae.sso.cover.BlackIpCover;
import org.aurorae.sso.model.BlackIp;
import org.aurorae.sso.service.BlackIpService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * Ip 黑名单 Feign Client 接口实现
 *
 * @author aurorae
 */
@Slf4j
@RestController
@RequestMapping(value = Common.Service.AUTH_BLACK_IP_URL_PREFIX)
public class BlackIpApi implements BlackIpClient {

    @Resource
    private BlackIpService blackIpService;

    @Override
    public Result<BlackIp> add(BlackIp blackIp) {
        try {
            BlackIp add = blackIpService.add(blackIp);
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
            return blackIpService.delete(id) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

    @Override
    public Result<BlackIp> update(BlackIp blackIp) {
        try {
            BlackIp update = blackIpService.update(blackIp);
            if (null != update) {
                return Result.ok(update);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<BlackIp> selectById(Long id) {
        try {
            BlackIp select = blackIpService.selectById(id);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<BlackIp> selectByIp(String ip) {
        try {
            BlackIp select = blackIpService.selectByIp(ip);
            if (null != select) {
                return Result.ok(select);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<Page<BlackIp>> list(BlackIpCover blackIpDto) {
        try {
            Page<BlackIp> page = blackIpService.list(blackIpDto);
            if (null != page) {
                return Result.ok(page);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail("Resource does not exist");
    }

    @Override
    public Result<Boolean> checkBlackIpValid(String ip) {
        try {
            return blackIpService.checkBlackIpValid(ip) ? Result.ok() : Result.fail();
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
    }

}
