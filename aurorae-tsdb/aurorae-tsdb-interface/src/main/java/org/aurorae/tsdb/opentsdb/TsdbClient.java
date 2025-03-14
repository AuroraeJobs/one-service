package org.aurorae.tsdb.opentsdb;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;

import java.io.IOException;
import java.util.function.BiFunction;

@Slf4j
public class TsdbClient<Request, Response> {

    private final String url;

    private final HttpClient httpClient;

    public TsdbClient(String url) {
        this.url = url;
        this.httpClient = HttpClientFactory.factory().getHttpClient();
    }

    public String execute(Endpoint endpoint, Request request) throws IOException {
        return httpClient.execute(url + endpoint.getPath(), request);
    }

    public static <U, R> R parse(String content, U clazz, BiFunction<String, U, R> parse) {
        return StringUtils.isEmpty(content) || clazz == null ? null : parse.apply(content, clazz);
    }

    public void request(Endpoint endpoint, Request request) {
        try {
            execute(endpoint, request);
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
    }

    public <R> R request(Endpoint endpoint, Request request, Class<Response> responseClass, BiFunction<String, Class<Response>, R> parse) {
        try {
            String content = execute(endpoint, request);
            return parse(content, responseClass, parse);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return null;
        }
    }
}
