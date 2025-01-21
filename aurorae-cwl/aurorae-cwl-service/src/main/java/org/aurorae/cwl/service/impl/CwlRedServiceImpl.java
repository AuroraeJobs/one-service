package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlRedService;
import org.springframework.stereotype.Component;

@Component
public class CwlRedServiceImpl extends CwlYaoServiceImpl<CwlRed> implements CwlRedService {

    public CwlRedServiceImpl(CwlYaoRepository<CwlRed> repository){
        super(repository);
    }
}
