package org.aurorae.sso.client;

import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Dictionary;
import org.aurorae.common.util.Result;
import org.aurorae.sso.hystrix.DictionaryClientHystrix;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

/**
 * 字典 FeignClient
 *
 * @author aurorae
 */
@FeignClient(path = Common.Service.AUTH_DICTIONARY_URL_PREFIX, name = Common.Service.AUTH_SERVICE_NAME, fallbackFactory = DictionaryClientHystrix.class)
public interface DictionaryClient {

    /**
     * 查询租户 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/tenant")
    Result<List<Dictionary>> tenantDictionary();

    /**
     * 查询用户 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/user")
    Result<List<Dictionary>> userDictionary(@RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

    /**
     * 查询 Ip 黑名单 Dictionary
     *
     * @return List<Dictionary>
     */
    @GetMapping("/black_ip")
    Result<List<Dictionary>> blackIpDictionary(@RequestHeader(value = Common.Service.AUTH_TENANT_ID, defaultValue = "-1") Long tenantId);

}
