package org.aurorae.cwl.hystrix;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.client.CwlClient;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.response.CwlResult;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class CwlHystrix implements FallbackFactory<CwlClient> {

    @Override
    public CwlClient create(Throwable cause) {
        log.error("Hystrix:{}" + cause.getMessage());
        return new CwlClient() {
            @Override
            public List<Cwl> findByYear(String year) {
                return Collections.emptyList();
            }

            @Override
            public String echarts(String year) {
                return null;
            }

            @Override
            public Cwl findDesc() {
                return null;
            }

            @Override
            public Cwl findAsc() {
                return null;
            }

            @Override
            public List<CwlResult> getResultByCount(int issueCount) {
                return Collections.emptyList();
            }

            @Override
            public List<CwlResult> getByIssue(String start, String end) {
                return Collections.emptyList();
            }

            @Override
            public List<CwlResult> getByDay(String start, String end) {
                return Collections.emptyList();
            }

            @Override
            public int saveByCount(int issueCount) {
                return 0;
            }

            @Override
            public int saveByIssue(String start, String end) {
                return 0;
            }

            @Override
            public int saveByDay(String start, String end) {
                return 0;
            }

            @Override
            public int saveByYear(String year) {
                return 0;
            }
        };
    }
}
