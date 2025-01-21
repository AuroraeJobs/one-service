package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed3;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlRed3Service;
import org.springframework.stereotype.Component;

@Component
public class CwlRed3ServiceImpl extends CwlYaoServiceImpl<CwlRed3> implements CwlRed3Service {

    public CwlRed3ServiceImpl(CwlYaoRepository<CwlRed3> repository){
        super(repository);
    }
}
