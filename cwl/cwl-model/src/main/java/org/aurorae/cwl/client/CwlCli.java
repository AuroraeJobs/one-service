package org.aurorae.cwl.client;

import org.aurorae.common.util.JsonUtil;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.stream.Collectors;

public class CwlCli {

    public static <T> T get(String url, Object request, Class<T> tClass) {
        return JsonUtil.toObject(get(url, JsonUtil.toObject(JsonUtil.toJson(request), Map.class)), tClass);
    }

    public static String get(String url, Map<Object, Object> params) {
        return get(url + params
                .entrySet()
                .stream()
                .map(entry -> String.format("%s=%s", entry.getKey(), entry.getValue()))
                .collect(Collectors.joining("&", "?", "")));
    }

    public static String get(String url) {
        return request(url, null, HttpMethod.GET);
    }

    public static String post(String url, String body) {
        return request(url, body, HttpMethod.POST);
    }

    public static String put(String url, String body) {
        return request(url, body, HttpMethod.PUT);
    }

    public static String delete(String url, String body) {
        return request(url, body, HttpMethod.DELETE);
    }

    private static String request(String url, String body, HttpMethod method) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        // 设置建立连接超时时间
        requestFactory.setConnectTimeout(10000);
        // 设置等待返回超时时间
        requestFactory.setReadTimeout(10000);

        RestTemplate client = new RestTemplate(requestFactory);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "*/*");
        headers.add("Cookie", "HMF_CI=b314588f9539ec15966b016695812b326dc630224db1167fcbfaa7568a048fb4c2");
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = client.exchange(url, method, requestEntity, String.class);
        return response.getBody();
    }
}
