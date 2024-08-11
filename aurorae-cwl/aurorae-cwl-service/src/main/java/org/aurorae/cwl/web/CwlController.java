package org.aurorae.cwl.web;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.client.CwlClient;
import org.aurorae.cwl.model.Cwl;
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
    public List<Cwl> getByCount(long issueCount) {
        return service.getByCount(issueCount);
    }

    @Override
    public List<Cwl> getByIssue(String start, String end) {
        return service.getByIssue(start, end);
    }

    @Override
    public int saveByCount(long issueCount) {
        return service.saveByCount(issueCount);
    }

    @Override
    public int saveByIssue(String start, String end) {
        return service.saveByIssue(start, end);
    }

    @Override
    public int saveByYear(int year) {
        return service.saveByYear(year);
    }
}
