package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed0;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlRed0Service;
import org.springframework.stereotype.Component;

@Component
public class CwlRed0ServiceImpl extends CwlYaoServiceImpl<CwlRed0> implements CwlRed0Service {

    public CwlRed0ServiceImpl(CwlYaoRepository<CwlRed0> repository){
        super(repository);
    }
}
