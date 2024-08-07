package org.aurorae.flink.source;

import org.apache.flink.streaming.api.functions.source.SourceFunction;

/**
 * @author Leonardo Fibonacci(莱昂纳多·斐波那契)
 * sequence generator
 * fn = f(n-1) + f(n-2)
 * f(n-1) : x
 * f(n-2) : y
 */
public class Fibonacci implements SourceFunction<Long> {

    private boolean running = true;
    private long x = 1, y = 0;

    @Override
    public void run(SourceContext<Long> ctx) throws Exception {
        while (running) {
            x = x + y;
            y = x - y;
            ctx.collect(x);
            Thread.sleep(10000);
        }
    }

    @Override
    public void cancel() {
        running = false;
    }
}
