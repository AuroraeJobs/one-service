package org.aurorae.cwl.service.impl;

import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.repository.CwlRepository;
import org.aurorae.cwl.service.CwlService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Comparator;
import java.util.List;

@Component
public class CwlServiceImpl implements CwlService {

    @Resource
    private CwlRepository repository;

    @Override
    public String echarts(String year) {
        List<Cwl> all = findByYear(year);
        System.out.println(StreamUtil.toList(all, Cwl::getRed0));
        System.out.println(StreamUtil.toList(all, Cwl::getBlue));
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
}
