package org.aurorae.cwl.web;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.client.CwlClient;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.request.CwlRequest;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.CwlService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("cwl")
public class CwlController implements CwlClient {

    @Resource
    private CwlService service;

    @Override
    public List<Cwl> findByYear(String year) {
        return service.findByYear(year);
    }

    @Override
    public String echarts(String year) {
        return service.echarts(year);
    }

    @Override
    public Cwl findDesc() {
        return service.findDesc();
    }

    @Override
    public Cwl findAsc() {
        return service.findAsc();
    }

    @Override
    public List<CwlResult> getResultByCount(int issueCount) {
        return CwlCli.result(issueCount, CwlRequest::byCount);
    }

    @Override
    public List<CwlResult> getByIssue(String start, String end) {
        return CwlCli.result(start, end, CwlRequest::byIssue);
    }

    @Override
    public List<CwlResult> getByDay(String start, String end) {
        return CwlCli.result(start, end, CwlRequest::byDay);
    }

    @Override
    public int saveByCount(int issueCount) {
        return service.saveByCount(issueCount);
    }

    @Override
    public int saveByIssue(String start, String end) {
        return service.saveByIssue(start, end);
    }

    @Override
    public int saveByDay(String start, String end) {
        return service.saveByDay(start, end);
    }

    @Override
    public int saveByYear(String year) {
        return service.saveByIssue(year + "101", year + "200") + service.saveByIssue(year + "001", year + "100");
    }
}
