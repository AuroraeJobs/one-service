package com.one.record.service;

import com.one.record.ball.ColorBox;
import com.one.record.response.Record;

import java.util.List;

public interface IBoxService {

    void save(ColorBox box);

    ColorBox findById(String code);

    void init(List<Record> records);

    void update(String code, List<Record> records);
}
