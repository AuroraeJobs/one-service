package org.aurorae.tsdb.opentsdb;

import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HeaderElement;
import org.apache.http.HeaderElementIterator;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ConnectionKeepAliveStrategy;
import org.apache.http.conn.HttpClientConnectionManager;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicHeaderElementIterator;
import org.apache.http.protocol.HTTP;
import org.aurorae.common.util.HttpUtils;
import org.aurorae.common.util.StringUtil;
import org.aurorae.common.util.ThreadTimer;

import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
public class HttpClient {

    private static final int DEFAULT_MAX_TOTAL_CONNECTIONS = 200;
    private static final int DEFAULT_CONNECTION_TIMEOUT_MILLISECONDS = (180 * 1000);
    private static final int DEFAULT_READ_TIMEOUT_MILLISECONDS = (180 * 1000);
    private static final int DEFAULT_WAIT_TIMEOUT_MILLISECONDS = (180 * 1000);
    private static final int DEFAULT_KEEP_ALIVE_MILLISECONDS = (5 * 60 * 1000);

    private final CloseableHttpClient httpClient;

    public HttpClient() {
        PoolingHttpClientConnectionManager connectionPool = new PoolingHttpClientConnectionManager();
        // Increase max total connection
        connectionPool.setMaxTotal(DEFAULT_MAX_TOTAL_CONNECTIONS);
        // Increase default max connection per route
        connectionPool.setDefaultMaxPerRoute(DEFAULT_MAX_TOTAL_CONNECTIONS);
        // config timeout
        RequestConfig config = RequestConfig
                .custom()
                .setConnectTimeout(DEFAULT_CONNECTION_TIMEOUT_MILLISECONDS)
                .setConnectionRequestTimeout(DEFAULT_WAIT_TIMEOUT_MILLISECONDS)
                .setSocketTimeout(DEFAULT_READ_TIMEOUT_MILLISECONDS)
                .build();
        ConnectionKeepAliveStrategy keepAliveStrategy = (response, context) -> {
            HeaderElementIterator it = new BasicHeaderElementIterator(response.headerIterator(HTTP.CONN_KEEP_ALIVE));
            while (it.hasNext()) {
                HeaderElement he = it.nextElement();
                String param = he.getName();
                String value = he.getValue();
                if (value != null && param.equalsIgnoreCase("timeout")) {
                    return Long.parseLong(value) * 1000;
                }
            }
            return DEFAULT_KEEP_ALIVE_MILLISECONDS;
        };
        httpClient = HttpClients
                .custom()
                .setConnectionManager(connectionPool)
                .setDefaultRequestConfig(config)
                .setKeepAliveStrategy(keepAliveStrategy)
                .build();
        // detect idle and expired connections and close them
        IdleConnectionMonitorThread staleMonitor = new IdleConnectionMonitorThread(connectionPool);
        staleMonitor.start();
    }

    public static class IdleConnectionMonitorThread extends Thread {
        private final HttpClientConnectionManager connMgr;
        private volatile boolean shutdown;

        public IdleConnectionMonitorThread(HttpClientConnectionManager connMgr) {
            super();
            this.connMgr = connMgr;
        }

        @Override
        public void run() {
            try {
                while (!shutdown) {
                    synchronized (this) {
                        wait(5000);
                        // Close expired connections
                        connMgr.closeExpiredConnections();
                        // Optionally, close connections
                        // that have been idle longer than 60 sec
                        connMgr.closeIdleConnections(60, TimeUnit.SECONDS);
                    }
                }
            } catch (InterruptedException ex) {
                // terminate
                shutdown();
            }
        }

        public void shutdown() {
            shutdown = true;
            synchronized (this) {
                notifyAll();
            }
        }
    }

    public <Request> String execute(String url, Request request) throws IOException {
        HttpPost post = HttpUtils.httpPost(url, request);
        HttpResponse response = HttpUtils.execute(httpClient, post, 3);
        if (response == null) {
            return null;
        }
        int status = response.getStatusLine().getStatusCode();
        String content = HttpUtils.httpEntity(response.getEntity());
        ThreadTimer.clear(status + ": " + content);
        if (status == HttpStatus.SC_OK || status == HttpStatus.SC_NO_CONTENT) {
            return content;
        } else if (StringUtil.isNotEmpty(content)) {
            // 内容不为空
            if (status == HttpStatus.SC_BAD_REQUEST) {
                // = 400
                Optional.ofNullable(JSON.parseObject(content, BadRequestException.class))
                        .ifPresent(e -> {
                            BadRequestError error = e.getError();
                            ThreadTimer.debug("Code={}, Message={}\nDetails={}, Trace={}", error.getCode(), error.getMessage(), error.getDetails(), error.getTrace());
                        });
                return null;
            } else if (status > HttpStatus.SC_BAD_REQUEST) {
                // > 400
                return null;
            } else {
                // < 400
                return content;
            }
        } else {
            // 内容为空
            return null;
        }
    }
}