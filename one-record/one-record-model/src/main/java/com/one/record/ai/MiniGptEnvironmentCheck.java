package com.one.record.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MiniGptEnvironmentCheck implements Serializable {

    private String playgroundDir;

    private String pythonPath;

    private Boolean pythonAvailable;

    private Boolean pymongoAvailable;

    private String pymongoVersion;

    private Boolean mongoAvailable;

    private String mongoUri;

    private String mongoDb;

    private String status;

    private String message;

    private Long checkedAt;
}
