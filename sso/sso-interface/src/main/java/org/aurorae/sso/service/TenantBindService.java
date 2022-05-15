package org.aurorae.sso.service;

import org.aurorae.common.service.Service;
import org.aurorae.sso.cover.TenantBindCover;
import org.aurorae.sso.model.TenantBind;

/**
 * TenantBind Interface
 *
 * @author aurorae
 */
public interface TenantBindService extends Service<TenantBind, TenantBindCover> {

    /**
     * 根据 租户ID 和 关联的用户ID 查询
     *
     * @param tenantId TenantID
     * @param userId   userId
     * @return TenantBind
     */
    TenantBind selectByTenantIdAndUserId(Long tenantId, Long userId);
}
