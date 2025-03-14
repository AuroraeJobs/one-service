package org.aurorae.tsdb.opentsdb;

public class HttpClientFactory {

    private static final HttpClientFactory FACTORY;

    static {
        FACTORY = new HttpClientFactory();
    }

    public static HttpClientFactory factory() {
        return FACTORY;
    }

    public HttpClient getHttpClient() {
        return new HttpClient();
    }
}
