package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.client.CwlUrl;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.request.CwlRequest;
import org.aurorae.cwl.response.CwlResponse;
import org.aurorae.cwl.repository.CwlRepository;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.CwlService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CwlServiceImpl implements CwlService {

    @Resource
    private CwlRepository repository;

    @Override
    public String echarts(String year) {
        List<Cwl> all = findByYear(year);
        System.out.println(all.stream().map(Cwl::getRed0).collect(Collectors.toList()));
        System.out.println(all.stream().map(Cwl::getBlue).collect(Collectors.toList()));
        return all.stream().map(Cwl::getDate).collect(Collectors.joining("', '", "'", "'"));
    }

    @Override
    public List<Cwl> findByYear(String year) {
        List<Cwl> list = repository.findByDateStartsWith(year);
        list.sort(Comparator.comparing(Cwl::getDate));
        return list;
    }

    @Override
    public Cwl findById(Long code) {
        return repository.findById(code).orElse(null);
    }

    @Override
    public List<Cwl> findAllAsc() {
        List<Cwl> all = repository.findAll();
        all.sort(Comparator.comparing(Cwl::getDate));
        return all;
    }

    @Override
    public List<Cwl> findAllDesc() {
        List<Cwl> all = repository.findAll();
        all.sort(Comparator.comparing(Cwl::getDate).reversed());
        return all;
    }

    @Override
    public Cwl findDesc() {
        return repository.findTopByOrderByCodeDesc();
    }

    @Override
    public Cwl findAsc() {
        return repository.findTopByOrderByCodeAsc();
    }

    @Override
    public List<Cwl> saveAll(List<Cwl> all) {
        return repository.saveAll(all);
    }

    @Override
    public Cwl save(Cwl item) {
        return repository.save(item);
    }

    @Override
    public Cwl getNewIssue() {
        return getNewIssues(1).get(0);
    }

    @Override
    public List<Cwl> getNewIssues(int issueCount) {
        return getByCount(issueCount).stream().map(CwlResult::convertTo).collect(Collectors.toList());
    }

    @Override
    public List<Cwl> getIssues(String start, String end) {
        return getByIssue(start, end).stream().map(CwlResult::convertTo).collect(Collectors.toList());
    }

    @Override
    public List<Cwl> getIssuesByYear(int year) {
        return new ArrayList<Cwl>() {{
            addAll(getIssues(year + "001", year + "100"));
            addAll(getIssues(year + "101", year + "200"));
        }};
    }

    @Override
    public List<Cwl> getIssuesByDay(String start, String end) {
        return getByDay(start, end).stream().map(CwlResult::convertTo).collect(Collectors.toList());
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
        return saveByRequest(new CwlRequest(issueCount));
    }

    @Override
    public int saveByIssue(String start, String end) {
        return saveByRequest(new CwlRequest().setIssue(start, end));
    }

    @Override
    public int saveByDay(String start, String end) {
        return saveByRequest(new CwlRequest().setDay(start, end));
    }

    private int saveByRequest(CwlRequest request) {
        CwlResponse response = request(request);
        if (response.success()) {
            saveAll(response.getResult().stream().map(CwlResult::convertTo).collect(Collectors.toList()));
            return response.getResult().size();
        }
        return 0;
    }

    private CwlResponse request(CwlRequest request) {
        return CwlCli.get(CwlUrl.findDrawNotice(), request, CwlResponse.class);
    }
}
