package org.aurorae.tsdb.api;

import java.util.Map;

public interface ITags {

    Map<String, Object> getTags();

    void setTags(Map<String, Object> tags);
}
