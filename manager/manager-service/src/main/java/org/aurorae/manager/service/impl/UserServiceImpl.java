package org.aurorae.manager.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.manager.pojo.User;
import org.aurorae.manager.repository.UserRepository;
import org.aurorae.manager.service.UserService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

/**
 * @author aurorae
 */
@Service
@Component
public class UserServiceImpl implements UserService {

    @Resource
    private UserRepository userRepository;

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public User findByUsernameAndPassword(String username, String password) {
        return userRepository.findByUsernameAndPassword(username, password);
    }

    @Override
    public User save(String username, String password) {
        User byUsername = userRepository.findByUsername(username);
        if (byUsername != null) {
            return userRepository.save(new User(byUsername.getId(), username, password));
        }
        return userRepository.save(new User(username, password));
    }
}
