package org.aurorae.cwl.client;

import okhttp3.*;
import org.aurorae.common.util.JsonUtil;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.concurrent.TimeUnit;

public class CwlCli {

    public static final String COOKIE = "e2729f742d915a190d8cdf939518020bc47518bebac913aab941f70b2482cd65adde009bde373ef2a1def8deb16ef780ce8f504522d22ee74df318cb37b66a1e43";

    public static final OkHttpClient CLIENT = new OkHttpClient()
            .newBuilder()
            .connectTimeout(21, TimeUnit.DAYS)
            .followRedirects(false)
            .readTimeout(21, TimeUnit.DAYS)
            .addNetworkInterceptor(new Retry())
            .build();

    public static Request buildRequest(String url) {
        return new Request.Builder()
                .get()
                .url(url)
                .addHeader("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")
                .addHeader("Cookie", "HMF_CI=" + COOKIE)
                .build();
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
        return get(url + param);
    }

    public static String get(String url) {
        Request request = buildRequest(url);
        try {
            try (Response response = CLIENT.newCall(request).execute()) {
                if (response.isRedirect()) {
                    String redirectLocation = response.header("Location");
                    Request redirectRequest = buildRequest(redirectLocation);
                    try (Response redirectResponse = CLIENT.newCall(redirectRequest).execute()) {
                        if (redirectResponse.isSuccessful()) {
                            return Optional.ofNullable(redirectResponse.body()).map(s -> {
                                try {
                                    return s.string();
                                } catch (IOException e) {
                                    throw new RuntimeException(e);
                                }
                            }).orElse(null);
                        } else {
                            System.out.println("请求失败, 错误码: " + redirectResponse.code());
                            return null;
                        }
                    }
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return null;
    }
}
