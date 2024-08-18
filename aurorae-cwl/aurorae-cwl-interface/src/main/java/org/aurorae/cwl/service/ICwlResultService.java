package org.aurorae.cwl.service;

import org.aurorae.cwl.response.CwlResult;

import java.util.List;

public interface ICwlResultService {

    CwlResult findDesc();

    CwlResult save(CwlResult item);

    List<CwlResult> saveAll(List<CwlResult> item);
}
