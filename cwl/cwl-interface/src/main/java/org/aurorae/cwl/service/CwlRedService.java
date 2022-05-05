package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlRed;

import java.util.List;

public interface CwlRedService {

    CwlRed findById(Long id);

    CwlRed save(CwlRed item);

    List<CwlRed> findAll();
}
