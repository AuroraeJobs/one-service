package com.one.record.client;

import com.one.record.response.Record;
import com.one.record.response.RecordResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RecordClientTest {

    @Test
    void parseResponseRejectsBlankContentWithReadableMessage() {
        assertThatThrownBy(() -> RecordClient.parseResponse(null, RecordResponse.class))
                .isInstanceOf(RecordClientException.class)
                .hasMessage("彩票开奖接口未返回内容");

        assertThatThrownBy(() -> RecordClient.parseResponse("  ", RecordResponse.class))
                .isInstanceOf(RecordClientException.class)
                .hasMessage("彩票开奖接口未返回内容");
    }

    @Test
    void parseResponseWrapsInvalidJsonWithSnippet() {
        assertThatThrownBy(() -> RecordClient.parseResponse("<html>blocked</html>", RecordResponse.class))
                .isInstanceOf(RecordClientException.class)
                .hasMessageContaining("彩票开奖接口响应解析失败")
                .hasMessageContaining("blocked");
    }

    @Test
    void recordsFromResponseRejectsProviderBusinessFailure() {
        RecordResponse response = RecordResponse.builder()
                .state(500)
                .message("rate limited")
                .build();

        assertThatThrownBy(() -> RecordClient.recordsFromResponse(response))
                .isInstanceOf(RecordClientException.class)
                .hasMessage("彩票开奖接口返回失败: rate limited");
    }

    @Test
    void parseResponseCapturesFailureCategory() {
        assertThatThrownBy(() -> RecordClient.parseResponse("<html>blocked</html>", RecordResponse.class))
                .isInstanceOfSatisfying(RecordClientException.class, exception -> {
                    assertThat(exception.getFailureCategory()).isEqualTo("INVALID_JSON");
                    assertThat(exception.getResponseSnippet()).contains("blocked");
                    assertThat(exception.getNetworkMode()).isEqualTo("system");
                });
    }

    @Test
    void recordsFromResponseReturnsEmptyListWhenResultIsMissing() {
        RecordResponse response = RecordResponse.builder()
                .state(0)
                .result(null)
                .build();

        assertThat(RecordClient.recordsFromResponse(response)).isEmpty();
    }

    @Test
    void recordsFromResponseReturnsRecordsForSuccess() {
        Record record = new Record();
        record.setCode("2026068");
        RecordResponse response = RecordResponse.builder()
                .state(0)
                .result(List.of(record))
                .build();

        assertThat(RecordClient.recordsFromResponse(response))
                .extracting(Record::getCode)
                .containsExactly("2026068");
    }
}
