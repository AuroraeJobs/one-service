package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlRed1;

import java.util.List;

public interface CwlRed1Service {
    CwlRed1 findById(Long id);

    CwlRed1 save(CwlRed1 item);

    List<CwlRed1> findAll();
}
