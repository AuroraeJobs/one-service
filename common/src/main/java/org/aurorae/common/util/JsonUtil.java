package org.aurorae.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * @author aurorae
 */
public class JsonUtil {

    private static final ObjectMapper MAPPER;

    static {
        MAPPER = new ObjectMapper();
        MAPPER.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    }

    public static String toJson(Object obj) {

        try {
            return MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("格式转换异常：" + obj);
        }
    }

    public static <T> T toObject(String json, Class<T> cla) {
        try {
            return MAPPER.readValue(json, cla);
        } catch (IOException e) {
            throw new RuntimeException("格式转换异常：" + json);
        }
    }
}
