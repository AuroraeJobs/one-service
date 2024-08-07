package org.aurorae.core.service;

import org.aurorae.core.model.X2;

import java.util.List;

/**
 * @author aurorae
 */
public interface XiangService {
    /**
     * findAll
     *
     * @return list
     */
    List<X2> findAll();

    /**
     * save
     *
     * @param items 四象
     * @return 四象
     */
    List<X2> save(List<X2> items);
}
