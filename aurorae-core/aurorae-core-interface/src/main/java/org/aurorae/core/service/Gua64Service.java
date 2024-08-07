package org.aurorae.core.service;

import org.aurorae.core.model.X6;

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
    List<X6> findAll();

    /**
     * save
     *
     * @param items 八卦
     * @return 八卦
     */
    List<X6> save(List<X6> items);
}
