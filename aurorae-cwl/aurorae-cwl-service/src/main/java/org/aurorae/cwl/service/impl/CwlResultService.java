package org.aurorae.cwl.service.impl;

import cn.hutool.core.date.DateUtil;
import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.repository.CwlResultRepository;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.ICwlResultService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class CwlResultService implements ICwlResultService {

    @Resource
    private CwlResultRepository repository;

    @Override
    public void init() {
        for (int year = 2013; year <= DateUtil.thisYear(); year++) {
            saveAll(allYear(year));
        }
    }

    @Override
    public List<CwlResult> allYear(int year) {
        List<CwlResult> result = CwlCli.result(year + "-01-01", year + "-06-30");
        result.addAll(CwlCli.result(year + "-07-01", year + "-12-31"));
        return result;
    }

    @Override
    public List<CwlResult> getByIssue(String start, String end) {
        return CwlCli.result(start, end);
    }

    @Override
    public CwlResult findDesc() {
        return repository.findTopByOrderByCodeDesc();
    }

    @Override
    public CwlResult save(CwlResult item) {
        return repository.save(item);
    }

    @Override
    public List<CwlResult> saveAll(List<CwlResult> item) {
        return repository.saveAll(item);
    }
}
