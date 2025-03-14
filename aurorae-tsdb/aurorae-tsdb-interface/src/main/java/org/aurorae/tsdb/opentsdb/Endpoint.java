package org.aurorae.tsdb.opentsdb;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * API Endpoint
 *
 * @see <a href="http://opentsdb.net/docs/build/html/api_http/index.html#api-endpoints">All API Endpoints
 */
@AllArgsConstructor
public enum Endpoint {
    ANNOTATION("/api/annotation"), // Annotation CRUD
    PUT("/api/put"), // Write Data
    QUERY("/api/query"), // Query Data
    QUERY_LAST("/api/query/last"), // Query latest data
    QUERY_EXP("/api/query/exp"), // Query data by exp
    SUGGEST("/api/suggest"), // Auto complete Metrics/Tag Key/Tag Value names
    UID_ASSIGN("/api/uid/assign"), // Create Metrics/Tag Key/Tag Value
    ;
    /**
     * API Endpoint Path
     */
    @Getter
    private final String path;
}
