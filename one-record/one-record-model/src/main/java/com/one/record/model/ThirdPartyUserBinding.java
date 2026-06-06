package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.one.record.enums.ThirdPartyProvider;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "third_party_user_bindings")
@CompoundIndex(name = "idx_provider_third_party_user_id", def = "{'provider': 1, 'thirdPartyUserId': 1}", unique = true)
public class ThirdPartyUserBinding {

    @Id
    private String id;

    private ThirdPartyProvider provider;

    private String thirdPartyUserId;

    private String localUserId;

    private String localUsername;

    private String username;

    private String nickname;

    private String avatarUrl;

    private String email;

    private String accountKey;

    private String unionId;

    private Map<String, Object> rawProfile;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
