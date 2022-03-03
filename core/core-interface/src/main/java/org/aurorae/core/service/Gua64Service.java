package org.aurorae.core.service;

import org.aurorae.core.model.Gua64;

import java.util.List;

/**
 * @author aurorae
 */
public interface Gua64Service {
    /**
     * findAll
     *
     * @return list
     */
    List<Gua64> findAll();

    /**
     * save
     *
     * @param items 八卦
     * @return 八卦
     */
    List<Gua64> save(List<Gua64> items);
}
