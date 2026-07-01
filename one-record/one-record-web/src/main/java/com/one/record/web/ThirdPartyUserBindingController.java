package com.one.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.enums.ThirdPartyProvider;
import com.one.record.github.GitHubOAuthRequest;
import com.one.record.model.ThirdPartyUserBinding;
import com.one.record.service.IThirdPartyUserBindingService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("third-party/user-binding")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class ThirdPartyUserBindingController {

    private final IThirdPartyUserBindingService service;

    @PostMapping
    @Operation(summary = "保存第三方用户绑定", description = "按 provider + thirdPartyUserId 新增或更新第三方用户绑定")
    public ThirdPartyUserBinding saveOrUpdate(@RequestBody ThirdPartyUserBinding binding) {
        log.info("Saving third party user binding: {}", binding);
        return service.saveOrUpdate(binding);
    }

    @GetMapping("github/oauth/authorize-url")
    @Operation(summary = "生成 GitHub 授权地址", description = "生成 GitHub OAuth 第三方授权码流程的 authorize URL")
    public String gitHubAuthorizeUrl(@RequestParam(name = "state", required = false) String state,
                                     @RequestParam(name = "scope", required = false) String scope,
                                     @RequestParam(name = "redirectUri", required = false) String redirectUri) {
        return service.buildGitHubAuthorizeUrl(state, scope, redirectUri);
    }

    @PostMapping("github/oauth/bind")
    @Operation(summary = "绑定 GitHub 用户", description = "使用 GitHub OAuth 回调 code 获取用户资料并保存第三方绑定")
    public ThirdPartyUserBinding bindGitHubUser(@RequestBody GitHubOAuthRequest request) {
        return service.bindGitHubUser(request);
    }

    @PutMapping
    @Operation(summary = "更新第三方用户绑定", description = "按 id 更新第三方用户绑定资料")
    public ThirdPartyUserBinding update(@RequestBody ThirdPartyUserBinding binding) {
        return service.update(binding);
    }

    @DeleteMapping("{id}")
    @Operation(summary = "删除第三方用户绑定", description = "根据 id 删除第三方用户绑定")
    public void delete(@PathVariable("id") String id) {
        service.delete(id);
    }

    @GetMapping("{id}")
    @Operation(summary = "查询第三方用户绑定", description = "根据 id 查询第三方用户绑定")
    public ThirdPartyUserBinding findById(@PathVariable("id") String id) {
        return service.findById(id);
    }

    @GetMapping
    @Operation(summary = "查询第三方用户绑定列表", description = "查询所有第三方用户绑定")
    public List<ThirdPartyUserBinding> findAll() {
        return service.findAll();
    }

    @GetMapping("provider/{provider}")
    @Operation(summary = "按类型查询第三方用户绑定", description = "按 provider 查询第三方用户绑定")
    public List<ThirdPartyUserBinding> findByProvider(@PathVariable("provider") ThirdPartyProvider provider) {
        return service.findByProvider(provider);
    }

    @GetMapping("account/{accountKey}")
    @Operation(summary = "按账号 key 查询第三方用户绑定", description = "按 Tesla token accountKey 等业务账号 key 查询绑定")
    public List<ThirdPartyUserBinding> findByAccountKey(@PathVariable("accountKey") String accountKey) {
        return service.findByAccountKey(accountKey);
    }

    @GetMapping("local-user/{localUserId}")
    @Operation(summary = "按本地用户查询第三方绑定", description = "查询当前系统用户绑定的第三方账户")
    public List<ThirdPartyUserBinding> findByLocalUserId(@PathVariable("localUserId") String localUserId) {
        return service.findByLocalUserId(localUserId);
    }

    @GetMapping("search")
    @Operation(summary = "按第三方用户 id 查询绑定", description = "按 provider + thirdPartyUserId 查询第三方用户绑定")
    public ThirdPartyUserBinding findByProviderAndThirdPartyUserId(@RequestParam("provider") ThirdPartyProvider provider,
                                                                   @RequestParam("thirdPartyUserId") String thirdPartyUserId) {
        return service.findByProviderAndThirdPartyUserId(provider, thirdPartyUserId);
    }
}
