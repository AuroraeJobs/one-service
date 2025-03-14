package org.aurorae.tsdb.opentsdb;

import org.aurorae.common.util.DateUtils;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

@Getter
@Setter
@Slf4j
@NoArgsConstructor
@Accessors(chain = true)
public class TsdbTime {

    private Object start;
    private Object end;

    public TsdbTime(Object start, Object end) {
        this.start = Optional.ofNullable(start).orElseGet(DateUtils::beginOfToday);
        this.end = Optional.ofNullable(end).orElse(System.currentTimeMillis());
    }

    /**
     * 从一个列表中，赋值起始时间
     *
     * @param times 时间列表
     */
    public TsdbTime(Object times) {
        this.start = Optional.ofNullable(getTime(times, 0)).orElseGet(DateUtils::beginOfToday);
        this.end = Optional.ofNullable(getTime(times, 1)).orElse(System.currentTimeMillis());
    }

    /**
     * 从一个列表中，获取index目标值
     *
     * @param times 列表
     * @param index 列表第index个值
     * @return time
     */
    public static Object getTime(Object times, int index) {
        if (times instanceof List && ((List<?>) times).size() > index) {
            return ((List<?>) times).get(index);
        }
        return null;
    }

    public long getStartTime() {
        return getTimestamp(this.start);
    }

    public long getEndTime() {
        return getTimestamp(this.end);
    }

    public static long getTimestamp(Object time) {
        String s = String.valueOf(time);
        try {
            if (s.matches("[0-9]+")) {
                // 如果长度是10则认为是秒，补000变成毫秒
                return Long.parseLong(s.length() == 10 ? s + "000" : s);
            } else {
                return DateUtils.parseDate(s).getTime();
            }
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new IllegalArgumentException();
        }
    }
}
