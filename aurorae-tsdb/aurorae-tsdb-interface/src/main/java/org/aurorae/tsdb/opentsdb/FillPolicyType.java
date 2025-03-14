package org.aurorae.tsdb.opentsdb;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Built-in query fill policy
 *
 * @see <a href="http://opentsdb.net/docs/build/html/user_guide/query/downsampling.html#fill-policies">Built-in 2.x Fill Policies</a>
 */
public enum FillPolicyType {
    NAN("nan"),
    NONE("none"),
    NULL("null"),
    ZERO(0),
    SCALAR("scalar"),
    ;

    private Object value;

    FillPolicyType(Object name) {
        this.value = name;
    }

    @JsonValue
    public Object getValue() {
        return value;
    }
}
