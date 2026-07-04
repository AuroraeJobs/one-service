package com.one.record.service.impl;

import com.one.record.client.RecordCalendar;
import com.one.record.client.RecordClient;
import com.one.record.client.RecordClientDiagnostic;
import com.one.record.client.RecordClientOptions;
import com.one.record.configuration.RecordProperties;
import com.one.record.lottery.LotteryProviderProbeResult;
import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.service.LotteryDrawProvider;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@AllArgsConstructor
public class CwlLotteryDrawProvider implements LotteryDrawProvider {

    private final RecordProperties properties;

    @Override
    public String name() {
        return "cwl";
    }

    @Override
    public List<Record> fetchAfterDate(String lastDrawDate) {
        return RecordCalendar.fetch(lastDrawDate, options());
    }

    @Override
    public List<Record> fetchYearlyRecords() {
        return RecordClient.year(options());
    }

    @Override
    public LotteryProviderProbeResult probe() {
        RecordClientDiagnostic diagnostic = RecordClient.diagnose(RecordRequest.by(1), options());
        return LotteryProviderProbeResult.builder()
                .category("draw")
                .provider(name())
                .success(diagnostic.getSuccess())
                .status(Boolean.TRUE.equals(diagnostic.getSuccess()) ? "AVAILABLE" : "FAILED")
                .message(diagnostic.getMessage())
                .recordCount(diagnostic.getRecordCount())
                .durationMs(diagnostic.getDurationMs())
                .checkedAt(diagnostic.getCheckedAt())
                .failureCategory(diagnostic.getFailureCategory())
                .requestMode(diagnostic.getNetworkMode())
                .httpStatus(diagnostic.getHttpStatus())
                .responseContentType(diagnostic.getResponseContentType())
                .responseSnippet(diagnostic.getResponseSnippet())
                .networkBlockSuspected(diagnostic.getNetworkBlockSuspected())
                .build();
    }

    private RecordClientOptions options() {
        return RecordClientOptions.builder()
                .provider(name())
                .networkMode(properties.getProviderNetworkMode())
                .proxyHost(properties.getProviderProxyHost())
                .proxyPort(properties.getProviderProxyPort())
                .timeoutSeconds(properties.getProviderTimeoutSeconds())
                .diagnosticSnippetLength(properties.getProviderDiagnosticSnippetLength())
                .build();
    }
}
