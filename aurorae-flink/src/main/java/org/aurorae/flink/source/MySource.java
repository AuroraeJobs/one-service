package org.aurorae.flink.source;

import org.apache.flink.streaming.api.functions.source.SourceFunction;
import org.aurorae.flink.domain.MyData;

import java.util.Random;

public class MySource implements SourceFunction<MyData> {

    private boolean running = true;

    @Override
    public void run(SourceContext<MyData> ctx) throws Exception {
        Random random = new Random();

        String[] users = {"aurora", "alice", "jobs", "tom", "bili"};
        String[] urls = {"/home", "/index", "/carts", "/log", "/device"};
        while (running) {
            String user = users[random.nextInt(users.length)];
            String url = urls[random.nextInt(urls.length)];
            ctx.collect(new MyData(user, url, System.currentTimeMillis()));
            Thread.sleep(1000L);
        }
    }

    @Override
    public void cancel() {
        running = false;
    }
}
