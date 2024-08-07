package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlRed0;

import java.util.List;

public interface CwlRed0Service {

    CwlRed0 findById(Long id);

    CwlRed0 save(CwlRed0 item);

    List<CwlRed0> findAll();
}
