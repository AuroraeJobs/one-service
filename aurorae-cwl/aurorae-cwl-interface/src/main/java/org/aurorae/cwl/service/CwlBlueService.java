package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlBlue;

import java.util.List;

public interface CwlBlueService {
    CwlBlue findById(Long id);

    CwlBlue save(CwlBlue item);

    List<CwlBlue> findAll();
}
