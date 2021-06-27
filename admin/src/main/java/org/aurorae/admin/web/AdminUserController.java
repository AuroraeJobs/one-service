package org.aurorae.admin.web;

import com.alibaba.dubbo.config.annotation.Reference;
import org.aurorae.manager.pojo.User;
import org.aurorae.manager.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * @author aurorae
 */
@RestController
@RequestMapping("user")
public class AdminUserController {

    @Reference
    private UserService userService;

    @GetMapping("/get/{username}")
    public User get(@PathVariable String username) {
        return userService.findByUsername(username);
    }

    @GetMapping("/save/{username}/{password}")
    public User updatePasswordByUsername(@PathVariable String username, @PathVariable String password) {
        return userService.save(username, password);
    }
}
