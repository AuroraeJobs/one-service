package org.aurorae.cwl.service;

import org.aurorae.cwl.model.CwlYao;

import java.util.List;

public interface CwlYaoService<T extends CwlYao> {

    T findById(Long id);

    T save(T item);

    List<T> findAll();
}
