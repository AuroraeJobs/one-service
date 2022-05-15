package org.aurorae.sso.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.util.Dictionary;
import org.aurorae.sso.mapper.BlackIpMapper;
import org.aurorae.sso.mapper.TenantMapper;
import org.aurorae.sso.mapper.UserMapper;
import org.aurorae.sso.model.BlackIp;
import org.aurorae.sso.model.Tenant;
import org.aurorae.sso.model.User;
import org.aurorae.sso.service.DictionaryService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * @author aurorae
 */
@Slf4j
@Service
public class DictionaryServiceImpl implements DictionaryService {

    @Resource
    private UserMapper userMapper;
    @Resource
    private TenantMapper tenantMapper;
    @Resource
    private BlackIpMapper blackIpMapper;

    @Override
    @Cacheable(value = Common.Cache.TENANT + Common.Cache.DIC, key = "'dic'", unless = "#result==null")
    public List<Dictionary> tenantDictionary() {
        List<Dictionary> dictionaryList = new ArrayList<>(16);
        LambdaQueryWrapper<Tenant> queryWrapper = Wrappers.<Tenant>query().lambda();
        List<Tenant> tenantList = tenantMapper.selectList(queryWrapper);
        for (Tenant tenant : tenantList) {
            Dictionary driverDictionary = new Dictionary().setLabel(tenant.getName()).setValue(tenant.getId());
            dictionaryList.add(driverDictionary);
        }
        return dictionaryList;
    }

    @Override
    @Cacheable(value = Common.Cache.USER + Common.Cache.DIC, key = "'dic.'+#tenantId", unless = "#result==null")
    public List<Dictionary> userDictionary(Long tenantId) {
        List<Dictionary> dictionaryList = new ArrayList<>(16);
        LambdaQueryWrapper<User> queryWrapper = Wrappers.<User>query().lambda();
        List<User> userList = userMapper.selectList(queryWrapper);
        for (User user : userList) {
            Dictionary driverDictionary = new Dictionary().setLabel(user.getName()).setValue(user.getId());
            dictionaryList.add(driverDictionary);
        }
        return dictionaryList;
    }

    @Override
    @Cacheable(value = Common.Cache.BLACK_IP + Common.Cache.DIC, key = "'dic.'+#tenantId", unless = "#result==null")
    public List<Dictionary> blackIpDictionary(Long tenantId) {
        List<Dictionary> dictionaryList = new ArrayList<>(16);
        LambdaQueryWrapper<BlackIp> queryWrapper = Wrappers.<BlackIp>query().lambda();
        List<BlackIp> blackIpList = blackIpMapper.selectList(queryWrapper);
        for (BlackIp blackIp : blackIpList) {
            Dictionary driverDictionary = new Dictionary().setLabel(blackIp.getIp()).setValue(blackIp.getId());
            dictionaryList.add(driverDictionary);
        }
        return dictionaryList;
    }

}
