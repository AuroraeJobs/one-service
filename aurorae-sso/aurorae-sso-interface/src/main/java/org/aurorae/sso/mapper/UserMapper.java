package org.aurorae.sso.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.aurorae.sso.model.User;

/**
 * Mapper
 *
 * @author aurorae
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
