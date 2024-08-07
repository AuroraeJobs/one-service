package org.aurorae.sso.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.constant.Common;
import org.aurorae.common.exception.ServiceException;
import org.aurorae.common.util.Pages;
import org.aurorae.sso.cover.BlackIpCover;
import org.aurorae.sso.mapper.BlackIpMapper;
import org.aurorae.sso.model.BlackIp;
import org.aurorae.sso.service.BlackIpService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

/**
 * 用户服务接口实现类
 *
 * @author aurorae
 */
@Slf4j
@Service
public class BlackIpServiceImpl implements BlackIpService {

    @Resource
    private BlackIpMapper blackIpMapper;

    @Override
    @Caching(
            put = {
                    @CachePut(value = Common.Cache.BLACK_IP + Common.Cache.ID, key = "#blackIp.id", condition = "#result!=null"),
                    @CachePut(value = Common.Cache.BLACK_IP + Common.Cache.IP, key = "#blackIp.ip", condition = "#result!=null")
            },
            evict = {
                    @CacheEvict(value = Common.Cache.BLACK_IP + Common.Cache.LIST, allEntries = true, condition = "#result!=null")
            }
    )
    public BlackIp add(BlackIp blackIp) {
        BlackIp select = selectByIp(blackIp.getIp());
        if (null != select) {
            throw new ServiceException("The ip already exists in the blacklist");
        }
        if (blackIpMapper.insert(blackIp) > 0) {
            return blackIpMapper.selectById(blackIp.getId());
        }
        throw new ServiceException("The ip add to the blacklist failed");
    }

    @Override
    @Caching(
            evict = {
                    @CacheEvict(value = Common.Cache.BLACK_IP + Common.Cache.ID, key = "#id", condition = "#result==true"),
                    @CacheEvict(value = Common.Cache.BLACK_IP + Common.Cache.IP, allEntries = true, condition = "#result==true"),
                    @CacheEvict(value = Common.Cache.BLACK_IP + Common.Cache.LIST, allEntries = true, condition = "#result==true")
            }
    )
    public boolean delete(Long id) {
        BlackIp blackIp = selectById(id);
        if (null == blackIp) {
            throw new ServiceException("The ip does not exist in the blacklist");
        }
        return blackIpMapper.deleteById(id) > 0;
    }

    @Override
    @Caching(
            put = {
                    @CachePut(value = Common.Cache.BLACK_IP + Common.Cache.ID, key = "#blackIp.id", condition = "#result!=null"),
                    @CachePut(value = Common.Cache.BLACK_IP + Common.Cache.IP, key = "#blackIp.ip", condition = "#result!=null")
            },
            evict = {
                    @CacheEvict(value = Common.Cache.BLACK_IP + Common.Cache.LIST, allEntries = true, condition = "#result!=null")
            }
    )
    public BlackIp update(BlackIp blackIp) {
        blackIp.setIp(null).setUpdateTime(null);
        if (blackIpMapper.updateById(blackIp) > 0) {
            BlackIp select = blackIpMapper.selectById(blackIp.getId());
            blackIp.setIp(select.getIp());
            return select;
        }
        throw new ServiceException("The ip update failed in the blacklist");
    }

    @Override
    @Cacheable(value = Common.Cache.BLACK_IP + Common.Cache.ID, key = "#id", unless = "#result==null")
    public BlackIp selectById(Long id) {
        return blackIpMapper.selectById(id);
    }

    @Override
    @Cacheable(value = Common.Cache.BLACK_IP + Common.Cache.IP, key = "#ip", unless = "#result==null")
    public BlackIp selectByIp(String ip) {
        LambdaQueryWrapper<BlackIp> queryWrapper = Wrappers.<BlackIp>query().lambda();
        queryWrapper.eq(BlackIp::getIp, ip);
        return blackIpMapper.selectOne(queryWrapper);
    }

    @Override
    @Cacheable(value = Common.Cache.BLACK_IP + Common.Cache.LIST, keyGenerator = "commonKeyGenerator", unless = "#result==null")
    public Page<BlackIp> list(BlackIpCover blackIpDto) {
        if (null == blackIpDto.getPage()) {
            blackIpDto.setPage(new Pages());
        }
        return blackIpMapper.selectPage(blackIpDto.getPage().convert(), fuzzyQuery(blackIpDto));
    }

    @Override
    public boolean checkBlackIpValid(String ip) {
        BlackIp blackIp = selectByIp(ip);
        if (null != blackIp) {
            return blackIp.getEnable();
        }
        return false;
    }

    @Override
    public LambdaQueryWrapper<BlackIp> fuzzyQuery(BlackIpCover blackIpDto) {
        LambdaQueryWrapper<BlackIp> queryWrapper = Wrappers.<BlackIp>query().lambda();
        if (null != blackIpDto) {
            if (StrUtil.isNotBlank(blackIpDto.getIp())) {
                queryWrapper.like(BlackIp::getIp, blackIpDto.getIp());
            }
        }
        return queryWrapper;
    }

}
