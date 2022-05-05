package org.aurorae.cwl.runner;

import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class HttpClientRunner implements CommandLineRunner {

    @Autowired
    private HttpClient httpClient;

    @Override
    public void run(String... args) throws Exception {
        // System.out.println(EntityUtils.toString(httpClient.execute(new HttpGet("http://localhost:7083/core/yi/")).getEntity()));
    }
}
