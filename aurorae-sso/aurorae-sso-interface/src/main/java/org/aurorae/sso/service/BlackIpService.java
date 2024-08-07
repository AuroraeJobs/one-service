package org.aurorae.sso.service;

import org.aurorae.common.service.Service;
import org.aurorae.sso.cover.BlackIpCover;
import org.aurorae.sso.model.BlackIp;

/**
 * User Interface
 *
 * @author aurorae
 */
public interface BlackIpService extends Service<BlackIp, BlackIpCover> {
    /**
     * 根据 Ip 查询 BlackIp
     *
     * @param ip IP
     * @return BlackIp
     */
    BlackIp selectByIp(String ip);

    /**
     * 根据 Ip 是否在Ip黑名单列表
     *
     * @param ip IP
     * @return boolean
     */
    boolean checkBlackIpValid(String ip);
}
