package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlRed2;

import java.util.List;

public interface CwlRed2Service {
    CwlRed2 findById(Long id);

    CwlRed2 save(CwlRed2 item);

    List<CwlRed2> findAll();
}
