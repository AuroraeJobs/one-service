package com.one.record.web;

import lombok.extern.slf4j.Slf4j;
import com.one.common.exception.DuplicateException;
import com.one.common.exception.NotFoundException;
import com.one.record.dto.Response;
import com.one.record.exception.LotteryRecordSyncLogConflictException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global Exception Handler
 * 
 * @author aurorae
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Response<Object> handleDuplicateException(DuplicateException e) {
        log.error("Duplicate error: {}", e.getMessage());
        return Response.error(400, e.getMessage());
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Response<Object> handleNotFoundException(NotFoundException e) {
        log.error("Not found error: {}", e.getMessage());
        return Response.error(404, e.getMessage());
    }

    @ExceptionHandler(LotteryRecordSyncLogConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Response<Object> handleLotteryRecordSyncLogConflictException(LotteryRecordSyncLogConflictException e) {
        log.warn("Lottery record sync log conflict: {}", e.getMessage());
        return Response.error(409, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Response<Object> handleException(Exception e) {
        log.error("Unexpected error: ", e);
        return Response.error(500, "服务器内部错误: " + e.getMessage());
    }
}
