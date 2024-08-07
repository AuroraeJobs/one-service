package org.aurorae.sso.hystrix;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.Dictionary;
import org.aurorae.common.util.Result;
import org.aurorae.sso.client.DictionaryClient;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * DictionaryClientHystrix
 *
 * @author aurorae
 */
@Slf4j
@Component("Auth_DictionaryClientHystrix")
public class DictionaryClientHystrix implements FallbackFactory<DictionaryClient> {

    @Override
    public DictionaryClient create(Throwable throwable) {
        String message = throwable.getMessage() == null ? "No available server for client: AUTH" : throwable.getMessage();
        log.error("Hystrix:{}", message);

        return new DictionaryClient() {

            @Override
            public Result<List<Dictionary>> tenantDictionary() {
                return Result.fail(message);
            }

            @Override
            public Result<List<Dictionary>> userDictionary(Long tenantId) {
                return Result.fail(message);
            }

            @Override
            public Result<List<Dictionary>> blackIpDictionary(Long tenantId) {
                return Result.fail(message);
            }

        };
    }
}