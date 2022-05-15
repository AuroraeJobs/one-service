package org.aurorae.common.exception;

import cn.hutool.core.util.StrUtil;

/**
 * 自定义 服务 异常
 *
 * @author aurorae
 */
public class ServiceException extends RuntimeException {
    public ServiceException(CharSequence template, Object... params) {
        super(StrUtil.format(template, params));
    }
}
