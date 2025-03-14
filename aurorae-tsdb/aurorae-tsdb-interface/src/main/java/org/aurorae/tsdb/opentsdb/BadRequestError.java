package org.aurorae.tsdb.opentsdb;

import lombok.Data;

@Data
public class BadRequestError {
    private int code;
    private String message;
    private String details;
    private String trace;
}
