package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlGua;

public interface CwlGuaService {

    CwlGua save(CwlGua gua);

    CwlGua findById(Long id);
}
