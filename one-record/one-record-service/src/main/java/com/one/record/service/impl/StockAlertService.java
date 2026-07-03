package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.repository.StockAlertHistoryRepository;
import com.one.record.repository.StockAlertRuleRepository;
import com.one.record.service.IStockAlertService;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockAlertHistory;
import com.one.record.stock.StockAlertRule;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
@AllArgsConstructor
public class StockAlertService implements IStockAlertService {

    private static final String DEFAULT_USER_ID = "default";

    private static final int DEFAULT_THROTTLE_SECONDS = 3600;

    private static final Set<String> SUPPORTED_RULE_TYPES = Set.of("PRICE", "PERCENT_CHANGE", "VOLUME_ABNORMAL");

    private static final Set<String> SUPPORTED_DIRECTIONS = Set.of("ABOVE", "BELOW", "UP", "DOWN");

    private final StockAlertRuleRepository ruleRepository;

    private final StockAlertHistoryRepository historyRepository;

    private final IStockMarketService stockMarketService;

    @Override
    public List<StockAlertRule> rules(Boolean enabled) {
        if (enabled != null) {
            return ruleRepository.findByUserIdAndEnabledOrderByCreatedAtDesc(DEFAULT_USER_ID, enabled);
        }
        return ruleRepository.findByUserIdOrderByCreatedAtDesc(DEFAULT_USER_ID);
    }

    @Override
    public StockAlertRule saveRule(StockAlertRule rule) {
        if (rule == null) {
            throw new ServiceException("股票提醒规则不能为空");
        }
        Long now = System.currentTimeMillis();
        StockAlertRule target = StockAlertRule.builder()
                .userId(DEFAULT_USER_ID)
                .createdAt(now)
                .updatedAt(now)
                .build();
        copyRule(rule, target);
        return ruleRepository.save(target);
    }

    @Override
    public StockAlertRule updateRule(String id, StockAlertRule rule) {
        if (rule == null) {
            throw new ServiceException("股票提醒规则不能为空");
        }
        StockAlertRule target = ruleRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票提醒规则不存在: {}", id));
        copyRule(rule, target);
        target.setUpdatedAt(System.currentTimeMillis());
        return ruleRepository.save(target);
    }

    @Override
    public void deleteRule(String id) {
        StockAlertRule existing = ruleRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票提醒规则不存在: {}", id));
        ruleRepository.deleteById(existing.getId());
    }

    @Override
    public List<StockAlertHistory> history(String symbol) {
        if (StringUtils.hasText(symbol)) {
            return historyRepository.findTop100ByUserIdAndSymbolOrderByTriggeredAtDesc(
                    DEFAULT_USER_ID, stockMarketService.normalizeSymbol(symbol));
        }
        return historyRepository.findTop100ByUserIdOrderByTriggeredAtDesc(DEFAULT_USER_ID);
    }

    private void copyRule(StockAlertRule source, StockAlertRule target) {
        String symbol = stockMarketService.normalizeSymbol(source.getSymbol());
        if (!StringUtils.hasText(symbol)) {
            throw new ServiceException("股票代码不能为空");
        }
        String ruleType = normalizeRequiredValue(source.getRuleType(), "提醒类型不能为空");
        if (!SUPPORTED_RULE_TYPES.contains(ruleType)) {
            throw new ServiceException("不支持的提醒类型: {}", ruleType);
        }
        String direction = normalizeRequiredValue(source.getDirection(), "提醒方向不能为空");
        if (!SUPPORTED_DIRECTIONS.contains(direction)) {
            throw new ServiceException("不支持的提醒方向: {}", direction);
        }
        BigDecimal targetValue = source.getTargetValue();
        if (targetValue == null) {
            throw new ServiceException("提醒目标值不能为空");
        }

        target.setSymbol(symbol);
        target.setMarket(market(symbol));
        target.setCode(code(symbol));
        target.setName(trimToNull(source.getName()));
        target.setRuleType(ruleType);
        target.setDirection(direction);
        target.setTargetValue(targetValue);
        target.setEnabled(source.getEnabled() == null || Boolean.TRUE.equals(source.getEnabled()));
        target.setThrottleSeconds(source.getThrottleSeconds() == null ? DEFAULT_THROTTLE_SECONDS : source.getThrottleSeconds());
        target.setLastTriggeredAt(source.getLastTriggeredAt());
    }

    private String normalizeRequiredValue(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new ServiceException(message);
        }
        return value.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String market(String symbol) {
        return symbol.length() > 2 ? symbol.substring(0, 2) : "";
    }

    private String code(String symbol) {
        return symbol.length() > 2 ? symbol.substring(2) : symbol;
    }
}
