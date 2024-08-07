package org.aurorae.sso.cover;

import lombok.*;
import org.aurorae.common.service.Converter;
import org.aurorae.common.util.Pages;
import org.aurorae.sso.model.Tenant;
import org.springframework.beans.BeanUtils;

/**
 * User Cover
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class TenantCover extends Tenant implements Converter<Tenant, TenantCover> {

    private Pages page;

    @Override
    public void convertTo(Tenant tenant) {
        BeanUtils.copyProperties(this, tenant);
    }

    @Override
    public TenantCover convert(Tenant tenant) {
        BeanUtils.copyProperties(tenant, this);
        return this;
    }
}