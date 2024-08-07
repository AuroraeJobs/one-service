package org.aurorae.sso.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.aurorae.sso.model.Tenant;

/**
 * Mapper
 *
 * @author aurorae
 */
@Mapper
public interface TenantMapper extends BaseMapper<Tenant> {
}
