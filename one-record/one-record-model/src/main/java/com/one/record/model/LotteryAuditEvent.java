package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_audit_events")
public class LotteryAuditEvent {

    @Id
    private String id;

    private String eventType;

    private String targetType;

    private String targetId;

    private String requesterScope;

    @Builder.Default
    private Map<String, String> filters = new LinkedHashMap<>();

    private Integer rowCount;

    private String message;

    private Long generatedAt;
}
