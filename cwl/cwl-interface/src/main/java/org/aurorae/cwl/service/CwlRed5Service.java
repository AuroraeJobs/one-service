package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlRed5;

import java.util.List;

public interface CwlRed5Service {
    CwlRed5 findById(Long id);

    CwlRed5 save(CwlRed5 item);

    List<CwlRed5> findAll();
}
