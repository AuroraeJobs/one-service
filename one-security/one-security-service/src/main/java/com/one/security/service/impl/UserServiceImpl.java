package com.one.security.service.impl;

import lombok.extern.slf4j.Slf4j;
import com.one.security.repository.UserRepository;
import com.one.security.service.UserService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

/**
 * 用户服务接口实现类
 *
 * @author aurorae
 */
@Slf4j
@Service
public class UserServiceImpl implements UserService {

    @Resource
    private UserRepository userRepository;
}
