package org.aurorae.core.service;

import org.aurorae.core.model.Xiang;

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
    List<Xiang> findAll();

    /**
     * save
     *
     * @param items 四象
     * @return 四象
     */
    List<Xiang> save(List<Xiang> items);
}
