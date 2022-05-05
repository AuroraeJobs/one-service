package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlValue;
import org.aurorae.cwl.vo.CwlCreaseV;

import java.util.List;

public interface CwlValueService {

    List<CwlValue> saveAll(List<CwlValue> all);

    void compareSum();

    CwlCreaseV compareRed0IsNot(int v);
}
