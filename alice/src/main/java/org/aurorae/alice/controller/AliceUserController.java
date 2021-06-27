package org.aurorae.alice.controller;

import com.alibaba.dubbo.config.annotation.Reference;
import org.aurorae.manager.pojo.User;
import org.aurorae.manager.service.UserService;
import org.aurorae.sso.service.LoginService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("user")
public class AliceUserController {

    @Reference
    private UserService userService;

    @Reference
    private LoginService loginService;

    @GetMapping("/get/{username}")
    public User get(@PathVariable String username) {
        return userService.findByUsername(username);
    }

    @GetMapping("/exists/{username}")
    public boolean exists(@PathVariable String username) {
        return userService.existsByUsername(username);
    }

    @GetMapping("/save/{username}/{password}")
    public User updatePasswordByUsername(@PathVariable String username, @PathVariable String password) {
        return userService.save(username, password);
    }

    @GetMapping("/login/{username}/{password}")
    public User login(@PathVariable String username, @PathVariable String password) {
        return loginService.login(username, password);
    }
}
