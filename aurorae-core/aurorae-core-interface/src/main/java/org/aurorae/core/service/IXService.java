package org.aurorae.core.service;

import org.aurorae.core.model.XX;

import java.util.List;

/**
 * @author aurorae
 */
public interface IXService {
    /**
     * findAll
     *
     * @return list
     */
    List<XX> findAll();

    /**
     * save
     *
     * @param items 两仪
     * @return 两仪
     */
    List<XX> save(List<XX> items);
}
