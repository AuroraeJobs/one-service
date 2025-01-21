package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed5;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlRed5Service;
import org.springframework.stereotype.Component;

@Component
public class CwlRed5ServiceImpl extends CwlYaoServiceImpl<CwlRed5> implements CwlRed5Service {

    public CwlRed5ServiceImpl(CwlYaoRepository<CwlRed5> repository){
        super(repository);
    }
}
