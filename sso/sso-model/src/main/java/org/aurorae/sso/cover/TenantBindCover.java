package org.aurorae.sso.cover;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.aurorae.common.service.Converter;
import org.aurorae.common.util.Pages;
import org.aurorae.sso.model.TenantBind;
import org.springframework.beans.BeanUtils;

/**
 * TenantBind DTO
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class TenantBindCover extends TenantBind implements Converter<TenantBind, TenantBindCover> {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Pages page;

    @Override
    public void convertTo(TenantBind bind) {
        BeanUtils.copyProperties(this, bind);
    }

    @Override
    public TenantBindCover convert(TenantBind bind) {
        BeanUtils.copyProperties(bind, this);
        return this;
    }
}