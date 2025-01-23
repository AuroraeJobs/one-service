package org.aurorae.cwl.client;

import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.aurorae.common.util.JsonUtil;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.request.RecordRequest;
import org.aurorae.cwl.response.Record;
import org.aurorae.cwl.response.RecordResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
public class RecordClient {

    private static final String URL = "http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";

    public static final String AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

    public static final OkHttpClient CLIENT = new OkHttpClient()
            .newBuilder()
            .connectTimeout(21, TimeUnit.DAYS)
            .followRedirects(false)
            .readTimeout(21, TimeUnit.DAYS)
            .addNetworkInterceptor(new Retry())
            .build();

    public static Request buildRequest(String url, String cookie) {
        return new Request.Builder()
                .get()
                .url(url)
                .addHeader("User-Agent", AGENT)
                .addHeader("Cookie", cookie)
                .build();
    }

    public static Record last() {
        return record(1).get(0);
    }

    public static List<Record> year(int year) {
        List<Record> result = record(year + "-01-01", year + "-06-30");
        result.addAll(record(year + "-07-01", year + "-12-31"));
        return result;
    }

    public static List<Record> record(long issueCount) {
        return record(RecordRequest.by(issueCount));
    }

    public static List<Record> record(String start, String end) {
        return record(RecordRequest.by(start, end));
    }

    public static List<Record> record(RecordRequest request) {
        RecordResponse response = get(request, RecordResponse.class);
        return response.success() ? response.getResult() : null;
    }

    public static <T> T get(Object request, Class<T> tClass) {
        Map<?, ?> params = JsonUtil.toObject(JsonUtil.toJson(request), Map.class);
        String response = get(params);
        return JsonUtil.toObject(response, tClass);
    }

    public static String get(Map<?, ?> params) {
        String param = StreamUtil.joining(params.entrySet(),
                entry -> entry.getKey() + "=" + entry.getValue(),
                "&", "?", "");
        return get(URL + param, "");
    }

    public static String get(String url, String cookie) {
        Request request = buildRequest(url, cookie);
        try {
            try (Response response = CLIENT.newCall(request).execute()) {
                if (response.isRedirect()) {
                    return get(response.header("Location"), response.header("Set-Cookie"));
                }
                if (response.isSuccessful()) {
                    return Optional.ofNullable(response.body()).map(body -> {
                        try {
                            return body.string();
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }).orElse(null);
                } else {
                    log.error("\n> 请求失败, 错误码: {}", response.code());
                }
            }
        } catch (IOException e) {
            log.error("\n> 请求异常, " + e.getMessage(), e);
        }
        return null;
    }
}
