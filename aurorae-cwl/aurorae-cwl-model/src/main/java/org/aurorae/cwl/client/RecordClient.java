package org.aurorae.cwl.client;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.aurorae.common.util.JsonUtil;
import org.aurorae.cwl.request.RecordRequest;
import org.aurorae.cwl.response.RecordResponse;
import org.aurorae.cwl.response.Record;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public class RecordClient {

    private static final String URL = "http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";

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
                .addHeader("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")
                .addHeader("Cookie", cookie)
                .build();
    }

    public static Record oneLast() {
        return result(1).get(0);
    }

    public static List<Record> oneYear(int year) {
        List<Record> result = result(year + "-01-01", year + "-06-30");
        result.addAll(result(year + "-07-01", year + "-12-31"));
        return result;
    }

    public static List<Record> result(long issueCount) {
        return result(() -> RecordRequest.by(issueCount));
    }

    public static List<Record> result(String start, String end) {
        return result(() -> RecordRequest.by(start, end));
    }

    public static List<Record> result(Supplier<RecordRequest> request) {
        return result(request.get());
    }

    public static List<Record> result(RecordRequest request) {
        RecordResponse response = get(request);
        return response.success() ? response.getResult() : null;
    }

    public static RecordResponse get(RecordRequest request) {
        return get(URL, request, RecordResponse.class);
    }

    public static <T> T get(String url, Object request, Class<T> tClass) {
        Map<?, ?> params = JsonUtil.toObject(JsonUtil.toJson(request), Map.class);
        String response = get(url, params);
        return JsonUtil.toObject(response, tClass);
    }

    public static String get(String url, Map<?, ?> params) {
        StringJoiner joiner = new StringJoiner("&", "?", "");
        for (Map.Entry<?, ?> entry : params.entrySet()) {
            String s = String.format("%s=%s", entry.getKey(), entry.getValue());
            joiner.add(s);
        }
        String param = joiner.toString();
        return get(url + param, "");
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
                    System.out.println("请求失败, 错误码: " + response.code());
                    return null;
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
