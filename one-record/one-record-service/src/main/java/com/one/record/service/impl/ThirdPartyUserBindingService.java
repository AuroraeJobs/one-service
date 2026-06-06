package com.one.record.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.enums.ThirdPartyProvider;
import com.one.record.model.ThirdPartyUserBinding;
import com.one.record.repository.ThirdPartyUserBindingRepository;
import com.one.record.service.IThirdPartyUserBindingService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class ThirdPartyUserBindingService implements IThirdPartyUserBindingService {

    private final ThirdPartyUserBindingRepository repository;

    @Override
    public ThirdPartyUserBinding saveOrUpdate(ThirdPartyUserBinding binding) {
        validate(binding);
        LocalDateTime now = LocalDateTime.now();
        ThirdPartyUserBinding target = repository
                .findByProviderAndThirdPartyUserId(binding.getProvider(), binding.getThirdPartyUserId())
                .orElseGet(() -> {
                    binding.setCreatedAt(now);
                    return binding;
                });

        target.setProvider(binding.getProvider());
        target.setThirdPartyUserId(binding.getThirdPartyUserId());
        target.setLocalUserId(binding.getLocalUserId());
        target.setLocalUsername(binding.getLocalUsername());
        target.setUsername(binding.getUsername());
        target.setNickname(binding.getNickname());
        target.setAvatarUrl(binding.getAvatarUrl());
        target.setEmail(binding.getEmail());
        target.setAccountKey(binding.getAccountKey());
        target.setUnionId(binding.getUnionId());
        target.setRawProfile(binding.getRawProfile());
        target.setUpdatedAt(now);
        return repository.save(target);
    }

    @Override
    public ThirdPartyUserBinding update(ThirdPartyUserBinding binding) {
        if (binding.getId() == null || binding.getId().trim().isEmpty()) {
            throw new ServiceException("第三方用户绑定 id 不能为空");
        }
        ThirdPartyUserBinding existing = repository.findById(binding.getId())
                .orElseThrow(() -> new NotFoundException("第三方用户绑定不存在: " + binding.getId()));

        existing.setUsername(binding.getUsername());
        existing.setLocalUserId(binding.getLocalUserId());
        existing.setLocalUsername(binding.getLocalUsername());
        existing.setNickname(binding.getNickname());
        existing.setAvatarUrl(binding.getAvatarUrl());
        existing.setEmail(binding.getEmail());
        existing.setAccountKey(binding.getAccountKey());
        existing.setUnionId(binding.getUnionId());
        existing.setRawProfile(binding.getRawProfile());
        existing.setUpdatedAt(LocalDateTime.now());
        return repository.save(existing);
    }

    @Override
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("第三方用户绑定不存在: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    public ThirdPartyUserBinding findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("第三方用户绑定不存在: " + id));
    }

    @Override
    public ThirdPartyUserBinding findByProviderAndThirdPartyUserId(ThirdPartyProvider provider, String thirdPartyUserId) {
        return repository.findByProviderAndThirdPartyUserId(provider, thirdPartyUserId)
                .orElseThrow(() -> new NotFoundException("第三方用户绑定不存在: " + provider + "/" + thirdPartyUserId));
    }

    @Override
    public List<ThirdPartyUserBinding> findAll() {
        return repository.findAllByOrderByUpdatedAtDesc();
    }

    @Override
    public List<ThirdPartyUserBinding> findByProvider(ThirdPartyProvider provider) {
        return repository.findByProvider(provider);
    }

    @Override
    public List<ThirdPartyUserBinding> findByAccountKey(String accountKey) {
        return repository.findByAccountKey(accountKey);
    }

    @Override
    public List<ThirdPartyUserBinding> findByLocalUserId(String localUserId) {
        return repository.findByLocalUserId(localUserId);
    }

    private void validate(ThirdPartyUserBinding binding) {
        if (binding == null) {
            throw new ServiceException("第三方用户绑定不能为空");
        }
        if (binding.getProvider() == null) {
            throw new ServiceException("第三方类型 provider 不能为空");
        }
        if (isBlank(binding.getThirdPartyUserId())) {
            throw new ServiceException("第三方用户 id 不能为空");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
