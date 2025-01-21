package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed2;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlRed2Service;
import org.springframework.stereotype.Component;

@Component
public class CwlRed2ServiceImpl extends CwlYaoServiceImpl<CwlRed2> implements CwlRed2Service {

    public CwlRed2ServiceImpl(CwlYaoRepository<CwlRed2> repository){
        super(repository);
    }
}
