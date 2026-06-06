package com.one.common.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * @author aurorae
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class AppException extends RuntimeException {

    private String msg;

    public AppException(String msg) {
        super(msg);
        this.msg = msg;
    }
}
