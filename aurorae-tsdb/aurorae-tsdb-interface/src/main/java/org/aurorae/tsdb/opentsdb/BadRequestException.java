package org.aurorae.tsdb.opentsdb;

import lombok.Getter;
import lombok.Setter;

import java.text.MessageFormat;

@Getter
@Setter
public class BadRequestException extends RuntimeException {

    private BadRequestError error;

    @Override
    public String getMessage() {
        return MessageFormat.format("code = {0}, message = {1}", error.getCode(), error.getMessage());
    }
}
