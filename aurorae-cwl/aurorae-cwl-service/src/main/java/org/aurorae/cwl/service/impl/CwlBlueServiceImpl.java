package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlBlue;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlBlueService;
import org.springframework.stereotype.Component;

@Component
public class CwlBlueServiceImpl extends CwlYaoServiceImpl<CwlBlue> implements CwlBlueService {

    public CwlBlueServiceImpl(CwlYaoRepository<CwlBlue> repository){
        super(repository);
    }
}
