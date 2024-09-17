package org.aurorae.cwl.client;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.aurorae.common.util.JsonUtil;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.request.CwlRequest;
import org.aurorae.cwl.response.CwlResponse;
import org.aurorae.cwl.response.CwlResult;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public class CwlCli {

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

    public static List<Cwl> request(long issueCount) {
        return request(() -> CwlRequest.by(issueCount));
    }

    public static List<Cwl> request(String start, String end) {
        return request(() -> CwlRequest.by(start, end));
    }

    public static List<Cwl> request(Supplier<CwlRequest> request) {
        return Optional.ofNullable(result(request))
                .map(items -> StreamUtil.toList(items, CwlResult::convertTo))
                .orElse(null);
    }

    public static CwlResult oneLast() {
        return result(1).get(0);
    }

    public static List<CwlResult> oneYear(int year) {
        List<CwlResult> result = result(year + "-01-01", year + "-06-30");
        result.addAll(result(year + "-07-01", year + "-12-31"));
        return result;
    }

    public static List<CwlResult> result(long issueCount) {
        return result(() -> CwlRequest.by(issueCount));
    }

    public static List<CwlResult> result(String start, String end) {
        return result(() -> CwlRequest.by(start, end));
    }

    public static List<CwlResult> result(Supplier<CwlRequest> request) {
        return result(request.get());
    }

    public static List<CwlResult> result(CwlRequest request) {
        CwlResponse response = get(request);
        return response.success() ? response.getResult() : null;
    }

    public static CwlResponse get(CwlRequest request) {
        return get(CwlUrl.findDrawNotice(), request, CwlResponse.class);
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
                    return Optional.ofNullable(response.body()).map(s -> {
                        try {
                            return s.string();
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
