package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.repository.CwlRepository;
import org.aurorae.cwl.request.CwlRequest;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.CwlService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Component
public class CwlServiceImpl implements CwlService {

    @Resource
    private CwlRepository repository;

    @Override
    public String echarts(String year) {
        List<Cwl> all = findByYear(year);
        System.out.println(CwlCli.mapper(all, Cwl::getRed0));
        System.out.println(CwlCli.mapper(all, Cwl::getBlue));
        return CwlCli.joining(all, Cwl::getDate, "', '", "'", "'");
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
        return CwlCli.resultCwl(issueCount, CwlRequest::byCount);
    }

    @Override
    public List<Cwl> getIssues(String start, String end) {
        return CwlCli.resultCwl(start, end, CwlRequest::byIssue);
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
        return CwlCli.resultCwl(start, end, CwlRequest::byDay);
    }

    @Override
    public List<CwlResult> getByCount(int issueCount) {
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
        return saveByRequest(CwlRequest.byCount(issueCount));
    }

    @Override
    public int saveByIssue(String start, String end) {
        return saveByRequest(CwlRequest.byIssue(start, end));
    }

    @Override
    public int saveByDay(String start, String end) {
        return saveByRequest(CwlRequest.byDay(start, end));
    }

    private int saveByRequest(CwlRequest request) {
        return Optional.ofNullable(CwlCli.resultCwl(() -> request))
                .map(this::saveAll)
                .map(List::size)
                .orElse(0);
    }
}
