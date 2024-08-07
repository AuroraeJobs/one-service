package org.aurorae.sso.cover;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.aurorae.common.service.Converter;
import org.aurorae.common.util.Pages;
import org.aurorae.sso.model.BlackIp;
import org.springframework.beans.BeanUtils;

/**
 * BlackIp DTO
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class BlackIpCover extends BlackIp implements Converter<BlackIp, BlackIpCover> {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Pages page;

    @Override
    public void convertTo(BlackIp blackIp) {
        BeanUtils.copyProperties(this, blackIp);
    }

    @Override
    public BlackIpCover convert(BlackIp blackIp) {
        BeanUtils.copyProperties(blackIp, this);
        return this;
    }
}