package org.aurorae.cwl.web;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.client.CwlClient;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.ICwlResultService;
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

    @Resource
    private ICwlResultService resultService;

    @Override
    public List<Cwl> findByYear(String year) {
        return service.findByYear(year);
    }

    @Override
    public String echarts(String year) {
        return service.echarts(year);
    }

    @Override
    public CwlResult findDesc() {
        return resultService.findDesc();
    }

    @Override
    public CwlResult findAsc() {
        return resultService.findAsc();
    }

    @Override
    public List<CwlResult> getByCount(long issueCount) {
        return CwlCli.result(issueCount);
    }

    @Override
    public List<CwlResult> getByIssue(String start, String end) {
        return CwlCli.result(start, end);
    }
}
