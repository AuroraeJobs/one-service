package org.aurorae.record.service;

import org.aurorae.record.ball.ColorBox;

public interface IBoxService {

    void save(ColorBox box);

    ColorBox findById(String code);
}
