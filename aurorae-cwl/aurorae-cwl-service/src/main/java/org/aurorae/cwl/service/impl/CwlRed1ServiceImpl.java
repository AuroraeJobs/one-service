package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed1;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlRed1Service;
import org.springframework.stereotype.Component;

@Component
public class CwlRed1ServiceImpl extends CwlYaoServiceImpl<CwlRed1> implements CwlRed1Service {

    public CwlRed1ServiceImpl(CwlYaoRepository<CwlRed1> repository){
        super(repository);
    }
}
