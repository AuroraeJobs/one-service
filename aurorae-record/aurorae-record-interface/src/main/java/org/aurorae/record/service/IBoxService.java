package org.aurorae.record.service;

import org.aurorae.record.ball.ColorBox;
import org.aurorae.record.response.Record;

import java.util.List;

public interface IBoxService {

    void save(ColorBox box);

    ColorBox findById(String code);

    void init(List<Record> records);

    void update(String code, List<Record> records);
}
