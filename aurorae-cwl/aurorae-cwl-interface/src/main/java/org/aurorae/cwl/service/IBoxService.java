package org.aurorae.cwl.service;

import org.aurorae.cwl.ball.ColorBox;

public interface IBoxService {

    void save(ColorBox box);

    ColorBox findById(String code);
}
