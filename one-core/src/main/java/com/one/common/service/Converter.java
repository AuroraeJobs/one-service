package com.one.common.service;

/**
 * Converter
 *
 * @author aurorae
 */
public interface Converter<D, T> {
    /**
     * DTO 转 DO
     *
     * @param d Do对象
     */
    void convertTo(D d);

    /**
     * DO 转 DTO
     *
     * @param d Do对象
     */
    T convert(D d);
}
