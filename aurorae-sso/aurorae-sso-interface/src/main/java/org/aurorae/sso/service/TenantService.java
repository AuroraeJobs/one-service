package org.aurorae.sso.service;

import org.aurorae.common.service.Service;
import org.aurorae.sso.cover.TenantCover;
import org.aurorae.sso.model.Tenant;

/**
 * Tenant Interface
 *
 * @author aurorae
 */
public interface TenantService extends Service<Tenant, TenantCover> {

    /**
     * 根据租户名查询租户
     *
     * @param name 租户名
     * @return Tenant
     */
    Tenant selectByName(String name);
}
