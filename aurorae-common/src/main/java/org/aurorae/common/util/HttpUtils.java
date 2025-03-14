package org.aurorae.common.util;

import com.alibaba.fastjson.JSON;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.HttpVersion;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

public class HttpUtils {

    private static final String DEFAULT_CHARSET = "UTF-8";
    public static final String DEFAULT_CONTENT_TYPE = "application/json;charset=utf-8";

    public static <Request> HttpPost httpPost(String url, Request request) {
        String requestBody = JSON.toJSONString(request, true);
        ThreadTimer.timer(url + "\n" + requestBody);
        HttpPost post = new HttpPost(url);
        post.addHeader("Content-type", DEFAULT_CONTENT_TYPE);
        post.setProtocolVersion(HttpVersion.HTTP_1_0);
        post.setEntity(new StringEntity(requestBody, StandardCharsets.UTF_8));
        return post;
    }

    public static HttpResponse execute(CloseableHttpClient httpClient, HttpUriRequest request, int retry) throws IOException {
        while (retry > 0) {
            try {
                return httpClient.execute(request);
            } catch (IOException e) {
                ThreadTimer.error("retry: " + retry + ", error: " + e.getMessage());
            }
            retry--;
        }
        return null;
    }

    public static String httpEntity(HttpEntity httpEntity) {
        return Optional.ofNullable(httpEntity)
                .map(entity -> {
                    String type = entity.getContentType().getValue();
                    String charset = getResponseCharset(type);
                    try {
                        return EntityUtils.toString(entity, charset);
                    } catch (IOException e) {
                        ThreadTimer.error("IOException: " + e.getMessage());
                        return null;
                    }
                }).orElse(null);
    }

    public static String getResponseCharset(String type) {
        String charset = DEFAULT_CHARSET;
        if (StringUtil.isNotEmpty(type)) {
            String[] params = type.split(";");
            for (String param : params) {
                param = param.trim();
                if (param.startsWith("charset")) {
                    String[] pair = param.split("=", 2);
                    if (pair.length == 2) {
                        if (StringUtil.isNotEmpty(pair[1])) {
                            charset = pair[1].trim();
                        }
                    }
                    break;
                }
            }
        }
        return charset;
    }
}
