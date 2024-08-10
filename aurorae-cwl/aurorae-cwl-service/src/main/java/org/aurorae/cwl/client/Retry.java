package org.aurorae.cwl.client;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;

public class Retry implements Interceptor {

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request request = chain.request();
        Response proceed = chain.proceed(request);
        System.out.println(proceed.code() + ": " + proceed.message());
        return proceed;
    }
}
