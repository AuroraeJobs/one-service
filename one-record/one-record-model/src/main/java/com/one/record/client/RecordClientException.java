package com.one.record.client;

import lombok.Getter;

@Getter
public class RecordClientException extends IllegalStateException {

    private final String failureCategory;

    private final String provider;

    private final String networkMode;

    private final Integer httpStatus;

    private final String responseContentType;

    private final String responseSnippet;

    private final Boolean networkBlockSuspected;

    public RecordClientException(String message,
                                 String failureCategory,
                                 String provider,
                                 String networkMode,
                                 Integer httpStatus,
                                 String responseContentType,
                                 String responseSnippet,
                                 Boolean networkBlockSuspected) {
        super(message);
        this.failureCategory = failureCategory;
        this.provider = provider;
        this.networkMode = networkMode;
        this.httpStatus = httpStatus;
        this.responseContentType = responseContentType;
        this.responseSnippet = responseSnippet;
        this.networkBlockSuspected = networkBlockSuspected;
    }

    public RecordClientException(String message,
                                 Throwable cause,
                                 String failureCategory,
                                 String provider,
                                 String networkMode,
                                 Integer httpStatus,
                                 String responseContentType,
                                 String responseSnippet,
                                 Boolean networkBlockSuspected) {
        super(message, cause);
        this.failureCategory = failureCategory;
        this.provider = provider;
        this.networkMode = networkMode;
        this.httpStatus = httpStatus;
        this.responseContentType = responseContentType;
        this.responseSnippet = responseSnippet;
        this.networkBlockSuspected = networkBlockSuspected;
    }
}
