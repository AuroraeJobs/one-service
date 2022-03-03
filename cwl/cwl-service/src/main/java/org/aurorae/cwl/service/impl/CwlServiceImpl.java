package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.cwl.client.CwlClient;
import org.aurorae.cwl.client.CwlUrl;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.request.CwlRequest;
import org.aurorae.cwl.response.CwlResponse;
import org.aurorae.cwl.repository.CwlRepository;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.CwlService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Component
public class CwlServiceImpl implements CwlService {

    @Resource
    private CwlRepository repository;

    @Override
    public List<Cwl> findByYear(String year) {
        return repository.findByDateStartsWith(year);
    }

    @Override
    public List<CwlResult> getByCount(int issueCount) {
        return request(new CwlRequest(issueCount)).getResult();
    }

    @Override
    public List<CwlResult> getByIssue(String start, String end) {
        return request(new CwlRequest().setIssue(start, end)).getResult();
    }

    @Override
    public List<CwlResult> getByDay(String start, String end) {
        return request(new CwlRequest().setDay(start, end)).getResult();
    }

    @Override
    public int saveByCount(int issueCount) {
        return save(new CwlRequest(issueCount));
    }

    @Override
    public int saveByIssue(String start, String end) {
        return save(new CwlRequest().setIssue(start, end));
    }

    @Override
    public int saveByDay(String start, String end) {
        return save(new CwlRequest().setDay(start, end));
    }

    private int save(CwlRequest request) {
        CwlResponse response = request(request);
        if (response.success()) {
            repository.saveAll(response.getResult().stream().map(CwlResult::convertTo).collect(Collectors.toList()));
            return response.getResult().size();
        }
        return 0;
    }

    private CwlResponse request(CwlRequest request) {
        return CwlClient.get(CwlUrl.findDrawNotice(), request, CwlResponse.class);
    }
}
