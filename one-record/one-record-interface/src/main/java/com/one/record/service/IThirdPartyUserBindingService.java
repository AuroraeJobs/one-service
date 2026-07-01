package com.one.record.service;

import com.one.record.enums.ThirdPartyProvider;
import com.one.record.github.GitHubOAuthRequest;
import com.one.record.model.ThirdPartyUserBinding;

import java.util.List;

public interface IThirdPartyUserBindingService {

    ThirdPartyUserBinding saveOrUpdate(ThirdPartyUserBinding binding);

    String buildGitHubAuthorizeUrl(String state, String scope, String redirectUri);

    ThirdPartyUserBinding bindGitHubUser(GitHubOAuthRequest request);

    ThirdPartyUserBinding update(ThirdPartyUserBinding binding);

    void delete(String id);

    ThirdPartyUserBinding findById(String id);

    ThirdPartyUserBinding findByProviderAndThirdPartyUserId(ThirdPartyProvider provider, String thirdPartyUserId);

    List<ThirdPartyUserBinding> findAll();

    List<ThirdPartyUserBinding> findByProvider(ThirdPartyProvider provider);

    List<ThirdPartyUserBinding> findByAccountKey(String accountKey);

    List<ThirdPartyUserBinding> findByLocalUserId(String localUserId);
}
