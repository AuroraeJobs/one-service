package com.one.record.repository;

import com.one.record.enums.ThirdPartyProvider;
import com.one.record.model.ThirdPartyUserBinding;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThirdPartyUserBindingRepository extends MongoRepository<ThirdPartyUserBinding, String> {

    Optional<ThirdPartyUserBinding> findByProviderAndThirdPartyUserId(ThirdPartyProvider provider, String thirdPartyUserId);

    List<ThirdPartyUserBinding> findByProvider(ThirdPartyProvider provider);

    List<ThirdPartyUserBinding> findByAccountKey(String accountKey);

    List<ThirdPartyUserBinding> findByLocalUserId(String localUserId);

    List<ThirdPartyUserBinding> findAllByOrderByUpdatedAtDesc();

    boolean existsByProviderAndThirdPartyUserId(ThirdPartyProvider provider, String thirdPartyUserId);
}
