package com.one.common.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.one.common.constant.Common;

import java.io.Serializable;

/**
 * Response
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    private boolean ok = false;
    private int code = Code.OK.getCode();

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String message = Common.Response.ERROR;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private T data;

    /**
     * 成功
     *
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> ok() {
        return new Result().success();
    }

    /**
     * 成功 自定义提示信息
     *
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> ok(String message) {
        return new Result().success(message);
    }

    /**
     * 成功 自定义 Code & 提示信息
     *
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> ok(Code code, String message) {
        return new Result().success(code.getCode(), message);
    }

    /**
     * 成功 返回结果
     *
     * @param data 返回结果
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> ok(T data) {
        return new Result(data).success();
    }

    /**
     * 成功 返回结果 & 自定义提示信息
     *
     * @param data 返回结果
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> ok(T data, String message) {
        return new Result(data).success(message);
    }

    /**
     * 失败
     *
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> fail() {
        return new Result().failure();
    }

    /**
     * 失败 自定义提示信息
     *
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> fail(String message) {
        return new Result().failure(message);
    }

    /**
     * 失败 自定义 Code & 提示信息
     *
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> fail(Code code, String message) {
        return new Result().failure(code.getCode(), message);
    }

    /**
     * 失败 返回结果
     *
     * @param data 返回结果
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> fail(T data) {
        return new Result(data).failure();
    }

    /**
     * 失败 返回结果 & 自定义提示信息
     *
     * @param data 返回结果
     * @return Response
     */
    @SuppressWarnings("unchecked")
    public static <T> Result<T> fail(T data, String message) {
        return new Result(data).failure(message);
    }

    /**
     * 构造函数
     *
     * @param data 数据
     */
    private Result(T data) {
        this.data = data;
    }

    /**
     * 成功
     *
     * @return Response
     */
    private Result success() {
        this.ok = true;
        this.code = Code.OK.getCode();
        this.message = Common.Response.OK;
        return this;
    }

    /**
     * 成功 自定义提示信息
     *
     * @param message 成功提示信息
     * @return Response
     */
    private Result success(String message) {
        this.ok = true;
        this.code = Code.OK.getCode();
        this.message = message;
        return this;
    }

    /**
     * 成功 自定义提示信息
     *
     * @param code    Code
     * @param message 成功提示信息
     * @return Response
     */
    private Result success(int code, String message) {
        this.ok = true;
        this.code = code;
        this.message = message;
        return this;
    }

    /**
     * 失败
     *
     * @return Response
     */
    private Result failure() {
        this.ok = false;
        this.code = Code.FAILURE.getCode();
        this.message = Common.Response.ERROR;
        return this;
    }

    /**
     * 失败 自定义提示信息
     *
     * @param message 错误提示信息
     * @return Response
     */
    private Result failure(String message) {
        this.ok = false;
        this.code = Code.FAILURE.getCode();
        this.message = message;
        return this;
    }

    /**
     * 失败 自定义提示信息
     *
     * @param code    Code
     * @param message 错误提示信息
     * @return Response
     */
    private Result failure(int code, String message) {
        this.ok = false;
        this.code = code;
        this.message = message;
        return this;
    }

    public enum Code {
        OK(200), FAILURE(500), NotFound(3404);

        @Getter
        private int code;

        Code(int code) {
            this.code = code;
        }
    }
}
