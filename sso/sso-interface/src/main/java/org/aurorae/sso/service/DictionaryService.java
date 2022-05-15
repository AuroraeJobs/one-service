package org.aurorae.sso.service;

import org.aurorae.common.util.Dictionary;

import java.util.List;

/**
 * Dictionary Interface
 *
 * @author aurorae
 */
public interface DictionaryService {

    /**
     * 获取租户字典
     *
     * @return
     */
    List<Dictionary> tenantDictionary();

    /**
     * 获取用户字典
     *
     * @return
     */
    List<Dictionary> userDictionary(Long tenantId);

    /**
     * 获取 Ip 黑名单字典
     *
     * @return
     */
    List<Dictionary> blackIpDictionary(Long tenantId);

}
