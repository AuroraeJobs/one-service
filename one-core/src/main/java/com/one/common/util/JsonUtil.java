package com.one.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;

/**
 * @author aurorae
 */
public class JsonUtil {

    private static final ObjectMapper MAPPER;

    static {
        MAPPER = createObjectMapper();
    }

    public static ObjectMapper createObjectMapper() {
        return new ObjectMapper()
                .findAndRegisterModules()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    }

    public static ObjectMapper mapperCopy() {
        return MAPPER.copy();
    }

    public static String toJson(Object obj) {

        try {
            return MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 序列化异常：" + obj, e);
        }
    }

    public static <T> T toObject(String json, Class<T> cla) {
        try {
            return MAPPER.readValue(json, cla);
        } catch (IOException e) {
            throw new RuntimeException("JSON 反序列化异常：" + json, e);
        }
    }

    public static <T> T toObject(String json, TypeReference<T> type) {
        try {
            return MAPPER.readValue(json, type);
        } catch (IOException e) {
            throw new RuntimeException("JSON 反序列化异常：" + json, e);
        }
    }

    public static JsonNode toJsonNode(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (IOException e) {
            throw new RuntimeException("JSON 解析异常：" + json, e);
        }
    }

    public static void writeValue(File file, Object value) {
        try {
            MAPPER.writeValue(file, value);
        } catch (IOException e) {
            throw new RuntimeException("JSON 文件写入异常：" + file, e);
        }
    }
}
