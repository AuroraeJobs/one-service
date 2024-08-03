package org.aurorae.core.service;

import org.aurorae.core.model.X1;

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
    List<X1> findAll();

    /**
     * save
     *
     * @param items 两仪
     * @return 两仪
     */
    List<X1> save(List<X1> items);
}
