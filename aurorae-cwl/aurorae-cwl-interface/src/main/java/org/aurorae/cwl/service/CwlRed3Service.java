package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlRed3;

import java.util.List;

public interface CwlRed3Service {
    CwlRed3 findById(Long id);

    CwlRed3 save(CwlRed3 item);

    List<CwlRed3> findAll();
}
