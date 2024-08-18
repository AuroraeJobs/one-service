package org.aurorae.cwl.service;

import org.aurorae.cwl.response.CwlResult;

import java.util.List;

public interface ICwlResultService {

    void init();

    List<CwlResult> allYear(int year);

    List<CwlResult> getByIssue(String start, String end);

    CwlResult findDesc();

    CwlResult save(CwlResult item);

    List<CwlResult> saveAll(List<CwlResult> item);
}
