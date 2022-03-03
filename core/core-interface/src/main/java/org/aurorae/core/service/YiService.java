package org.aurorae.core.service;

import org.aurorae.core.model.Yi;

import java.util.List;

/**
 * @author aurorae
 */
public interface YiService {
    /**
     * findAll
     *
     * @return list
     */
    List<Yi> findAll();

    /**
     * save
     *
     * @param items 两仪
     * @return 两仪
     */
    List<Yi> save(List<Yi> items);
}
