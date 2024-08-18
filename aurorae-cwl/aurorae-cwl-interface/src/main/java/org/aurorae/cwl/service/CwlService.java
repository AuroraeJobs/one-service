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
}
