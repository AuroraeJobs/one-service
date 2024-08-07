package org.aurorae.core.service;

import org.aurorae.core.model.X3;

import java.util.List;

/**
 * @author aurorae
 */
public interface GuaService {
    /**
     * findAll
     *
     * @return list
     */
    List<X3> findAll();

    /**
     * save
     *
     * @param items 八卦
     * @return 八卦
     */
    List<X3> save(List<X3> items);
}
