package org.aurorae.core.service;

import org.aurorae.core.model.Gua;

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
    List<Gua> findAll();

    /**
     * save
     *
     * @param items 八卦
     * @return 八卦
     */
    List<Gua> save(List<Gua> items);
}
