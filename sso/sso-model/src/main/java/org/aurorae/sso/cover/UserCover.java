package org.aurorae.sso.cover;

import lombok.*;
import org.aurorae.common.service.Converter;
import org.aurorae.common.util.Pages;
import org.aurorae.sso.model.User;
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
public class UserCover extends User implements Converter<User, UserCover> {

    private Pages page;

    @Override
    public void convertTo(User user) {
        BeanUtils.copyProperties(this, user);
    }

    @Override
    public UserCover convert(User user) {
        BeanUtils.copyProperties(user, this);
        return this;
    }
}