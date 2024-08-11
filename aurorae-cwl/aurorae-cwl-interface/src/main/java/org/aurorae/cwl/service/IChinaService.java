package org.aurorae.cwl.service;

import org.aurorae.cwl.model.Province;

import java.util.Collection;

public interface IChinaService {

    Collection<Province> color(String color, String year);
}
