package org.aurorae.cwl.service.impl;

import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.repository.CwlRepository;
import org.aurorae.cwl.request.CwlRequest;
import org.aurorae.cwl.service.CwlService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
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
        System.out.println(StreamUtil.mapper(all, Cwl::getRed0));
        System.out.println(StreamUtil.mapper(all, Cwl::getBlue));
        return StreamUtil.joining(all, Cwl::getDate, "', '", "'", "'");
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

    private int saveByRequest(List<Cwl> items) {
        return Optional.ofNullable(items)
                .map(this::saveAll)
                .map(List::size)
                .orElse(0);
    }

    @Override
    public int saveByCount(long issueCount) {
        return saveByRequest(getByCount(issueCount));
    }

    @Override
    public int saveByIssue(String start, String end) {
        return saveByRequest(getByIssue(start, end));
    }

    @Override
    public int saveByYear(int year) {
        return saveByRequest(allYear(year));
    }

    @Override
    public Cwl oneLast() {
        return getByCount(1).get(0);
    }

    @Override
    public List<Cwl> allYear(int year) {
        List<Cwl> issues = getByIssue(year + "001", year + "100");
        issues.addAll(getByIssue(year + "101", year + "200"));
        return issues;
    }

    @Override
    public List<Cwl> getByCount(long issueCount) {
        return CwlCli.request(issueCount, CwlRequest::by);
    }

    @Override
    public List<Cwl> getByIssue(String start, String end) {
        return CwlCli.request(start, end, CwlRequest::by);
    }
}
