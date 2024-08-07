package org.aurorae.sso.api;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Dictionary;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.DictionaryClient;
import org.aurorae.sso.service.DictionaryService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

/**
 * @author aurorae
 */
@Slf4j
@RestController
@RequestMapping(Common.Service.AUTH_DICTIONARY_URL_PREFIX)
public class DictionaryApi implements DictionaryClient {

    @Resource
    private DictionaryService dictionaryService;

    @Override
    public Result<List<Dictionary>> tenantDictionary() {
        try {
            List<Dictionary> dictionaryList = dictionaryService.tenantDictionary();
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Dictionary>> userDictionary(Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.userDictionary(tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

    @Override
    public Result<List<Dictionary>> blackIpDictionary(Long tenantId) {
        try {
            List<Dictionary> dictionaryList = dictionaryService.blackIpDictionary(tenantId);
            if (null != dictionaryList) {
                return Result.ok(dictionaryList);
            }
        } catch (Exception e) {
            return Result.fail(e.getMessage());
        }
        return Result.fail();
    }

}
