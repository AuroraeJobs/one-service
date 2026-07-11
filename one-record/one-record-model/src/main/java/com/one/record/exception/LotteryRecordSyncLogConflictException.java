package com.one.record.exception;

public class LotteryRecordSyncLogConflictException extends RuntimeException {

    public LotteryRecordSyncLogConflictException(String id) {
        super("运行中的彩票同步记录不能删除: " + id);
    }
}
