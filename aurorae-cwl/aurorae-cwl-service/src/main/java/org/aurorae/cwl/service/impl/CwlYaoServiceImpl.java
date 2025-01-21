package org.aurorae.cwl.service.impl;

import lombok.AllArgsConstructor;
import org.aurorae.cwl.model.CwlYao;
import org.aurorae.cwl.repository.CwlYaoRepository;
import org.aurorae.cwl.service.CwlYaoService;

import java.util.List;

@AllArgsConstructor
public class CwlYaoServiceImpl<T extends CwlYao> implements CwlYaoService<T> {

    private final CwlYaoRepository<T> repository;

    @Override
    public T findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public T save(T item) {
        return repository.save(item);
    }

    @Override
    public List<T> findAll() {
        return repository.findAll();
    }
}
