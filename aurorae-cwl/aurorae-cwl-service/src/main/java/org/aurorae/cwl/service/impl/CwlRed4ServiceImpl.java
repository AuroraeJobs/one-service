package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed4;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlRed4Service;
import org.springframework.stereotype.Component;

@Component
public class CwlRed4ServiceImpl extends CwlYaoServiceImpl<CwlRed4> implements CwlRed4Service {

    public CwlRed4ServiceImpl(CwlYaoRepository<CwlRed4> repository){
        super(repository);
    }
}
