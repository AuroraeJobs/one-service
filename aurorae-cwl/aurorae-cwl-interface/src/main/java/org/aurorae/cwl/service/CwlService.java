package org.aurorae.cwl.service;

import org.aurorae.cwl.model.Cwl;

import java.util.List;

public interface CwlService {

    String echarts(String year);

    List<Cwl> findByYear(String year);

    List<Cwl> findAllAsc();

    Cwl findById(Long code);

    List<Cwl> findAllDesc();

    Cwl findDesc();

    Cwl findAsc();

    List<Cwl> saveAll(List<Cwl> list);

    Cwl save(Cwl item);

    int saveByCount(long issueCount);

    int saveByIssue(String start, String end);

    int saveByYear(int year);

    Cwl oneLast();

    List<Cwl> allYear(int year);

    List<Cwl> getByCount(long issueCount);

    List<Cwl> getByIssue(String start, String end);
}
