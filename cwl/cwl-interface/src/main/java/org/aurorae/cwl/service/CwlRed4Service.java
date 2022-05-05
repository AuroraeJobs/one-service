package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlRed4;

import java.util.List;

public interface CwlRed4Service {
    CwlRed4 findById(Long id);

    CwlRed4 save(CwlRed4 item);

    List<CwlRed4> findAll();
}
