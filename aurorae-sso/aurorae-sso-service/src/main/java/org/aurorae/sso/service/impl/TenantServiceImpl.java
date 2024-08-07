package org.aurorae.sso.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.exception.DuplicateException;
import org.aurorae.common.exception.NotFoundException;
import org.aurorae.common.exception.ServiceException;
import org.aurorae.common.util.Pages;
import org.aurorae.sso.cover.TenantCover;
import org.aurorae.sso.mapper.TenantMapper;
import org.aurorae.sso.model.Tenant;
import org.aurorae.sso.service.TenantService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Optional;

/**
 * 租户服务接口实现类
 *
 * @author aurorae
 */
@Slf4j
@Service
public class TenantServiceImpl implements TenantService {

    @Resource
    private TenantMapper tenantMapper;

    @Override
    @Caching(
            put = {
                    @CachePut(value = Common.Cache.TENANT + Common.Cache.ID, key = "#tenant.id", condition = "#result!=null"),
                    @CachePut(value = Common.Cache.TENANT + Common.Cache.NAME, key = "#tenant.name", condition = "#result!=null")
            },
            evict = {
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.DIC, allEntries = true, condition = "#result!=null"),
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.LIST, allEntries = true, condition = "#result!=null")
            }
    )
    public Tenant add(Tenant tenant) {
        System.out.println(tenant.getId() + ", " + tenant.getName());
        Tenant select = selectOneByName(tenant.getName());
        if (null != select) {
            throw new DuplicateException("The tenant already exists");
        }
        if (tenantMapper.insert(tenant) > 0) {
            System.out.println(tenant.getId() + ", " + tenant.getName());
            return tenantMapper.selectById(tenant.getId());
        }
        throw new ServiceException("The tenant add failed");
    }

    @Override
    @Caching(
            evict = {
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.ID, key = "#id", condition = "#result==true"),
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.NAME, allEntries = true, condition = "#result==true"),
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.DIC, allEntries = true, condition = "#result==true"),
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.LIST, allEntries = true, condition = "#result==true")
            }
    )
    public boolean delete(Long id) {
        Tenant tenant = selectById(id);
        if (null == tenant) {
            throw new NotFoundException("The tenant does not exist");
        }
        return tenantMapper.deleteById(id) > 0;
    }

    @Override
    @Caching(
            put = {
                    @CachePut(value = Common.Cache.TENANT + Common.Cache.ID, key = "#tenant.id", condition = "#result!=null"),
                    @CachePut(value = Common.Cache.TENANT + Common.Cache.NAME, key = "#tenant.name", condition = "#result!=null")
            },
            evict = {
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.DIC, allEntries = true, condition = "#result!=null"),
                    @CacheEvict(value = Common.Cache.TENANT + Common.Cache.LIST, allEntries = true, condition = "#result!=null")
            }
    )
    public Tenant update(Tenant tenant) {
        tenant.setName(null).setUpdateTime(null);
        if (tenantMapper.updateById(tenant) > 0) {
            Tenant select = tenantMapper.selectById(tenant.getId());
            tenant.setName(select.getName());
            return select;
        }
        throw new ServiceException("The tenant update failed");
    }

    @Override
    @Cacheable(value = Common.Cache.TENANT + Common.Cache.ID, key = "#id", unless = "#result==null")
    public Tenant selectById(Long id) {
        return tenantMapper.selectById(id);
    }

    @Cacheable(value = Common.Cache.TENANT + Common.Cache.NAME, key = "#name", unless = "#result==null")
    public Tenant selectOneByName(String name) {
        LambdaQueryWrapper<Tenant> queryWrapper = Wrappers.<Tenant>query().lambda();
        queryWrapper.eq(Tenant::getName, name);
        return tenantMapper.selectOne(queryWrapper);
    }

    @Override
    @Cacheable(value = Common.Cache.TENANT + Common.Cache.NAME, key = "#name", unless = "#result==null")
    public Tenant selectByName(String name) {
        Tenant tenant = selectOneByName(name);
        if (null == tenant) {
            throw new NotFoundException("The tenant does not exist");
        }
        return tenant;
    }

    @Override
    @Cacheable(value = Common.Cache.TENANT + Common.Cache.LIST, keyGenerator = "commonKeyGenerator", unless = "#result==null")
    public Page<Tenant> list(TenantCover tenantDto) {
        if (!Optional.ofNullable(tenantDto.getPage()).isPresent()) {
            tenantDto.setPage(new Pages());
        }
        return tenantMapper.selectPage(tenantDto.getPage().convert(), fuzzyQuery(tenantDto));
    }

    @Override
    public LambdaQueryWrapper<Tenant> fuzzyQuery(TenantCover tenantDto) {
        LambdaQueryWrapper<Tenant> queryWrapper = Wrappers.<Tenant>query().lambda();
        if (null != tenantDto) {
            if (StrUtil.isNotBlank(tenantDto.getName())) {
                queryWrapper.like(Tenant::getName, tenantDto.getName());
            }
        }
        return queryWrapper;
    }

}
