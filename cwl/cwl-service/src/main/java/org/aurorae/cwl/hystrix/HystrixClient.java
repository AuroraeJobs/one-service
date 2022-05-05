package org.aurorae.cwl.hystrix;

import com.netflix.hystrix.HystrixCommand;
import com.netflix.hystrix.HystrixCommandGroupKey;
import rx.Observable;
import rx.Observer;

public class HystrixClient {

    public static void main(String[] args) {
        RunCommand runCommand = new RunCommand("runCommand");
        Observable<String> stringObservable = runCommand.toObservable();
        stringObservable.subscribe(new Observer<String>() {
            @Override
            public void onCompleted() {
                System.out.println("completed!");
            }

            @Override
            public void onError(Throwable throwable) {

            }

            @Override
            public void onNext(String s) {
                System.out.println("onNext: " + s);
            }
        });
    }

    static class RunCommand extends HystrixCommand<String> {

        String request;

        public RunCommand(String request) {
            super(HystrixCommandGroupKey.Factory.asKey("cwl"));
            this.request = request;
        }

        @Override
        protected String run() throws Exception {
            System.out.println(request);
            return "success";
        }

    }
}
