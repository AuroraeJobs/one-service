package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.repository.StockAlertHistoryRepository;
import com.one.record.repository.StockAlertRuleRepository;
import com.one.record.service.IStockAlertService;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockAlertHistory;
import com.one.record.stock.StockAlertRule;
import com.one.record.stock.StockQuote;
import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    private final StringRedisTemplate redisTemplate;

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

    @Override
    public List<StockAlertHistory> evaluate() {
        List<StockAlertRule> enabledRules = ruleRepository.findByUserIdAndEnabledOrderByCreatedAtDesc(DEFAULT_USER_ID, true);
        if (enabledRules.isEmpty()) {
            markLastEvaluated();
            return List.of();
        }
        Map<String, StockQuote> quoteMap = stockMarketService.quotes(enabledRules.stream()
                        .map(StockAlertRule::getSymbol)
                        .filter(StringUtils::hasText)
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(StockQuote::getSymbol, Function.identity(), (left, right) -> left));

        List<StockAlertHistory> triggeredHistories = new ArrayList<>();
        for (StockAlertRule rule : enabledRules) {
            StockQuote quote = quoteMap.get(rule.getSymbol());
            if (quote == null || !Boolean.TRUE.equals(quote.getAvailable())) {
                continue;
            }
            BigDecimal triggerValue = triggerValue(rule, quote);
            if (triggerValue == null || !matches(rule, triggerValue) || throttled(rule)) {
                continue;
            }
            StockAlertHistory history = saveHistory(rule, triggerValue);
            triggeredHistories.add(history);
            markTriggered(rule);
        }
        markLastEvaluated();
        return triggeredHistories;
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

    private BigDecimal triggerValue(StockAlertRule rule, StockQuote quote) {
        return switch (rule.getRuleType()) {
            case "PRICE" -> quote.getPrice();
            case "PERCENT_CHANGE" -> quote.getChangePercent();
            case "VOLUME_ABNORMAL" -> quote.getVolume() == null ? null : BigDecimal.valueOf(quote.getVolume());
            default -> null;
        };
    }

    private boolean matches(StockAlertRule rule, BigDecimal triggerValue) {
        int compared = triggerValue.compareTo(rule.getTargetValue());
        return switch (rule.getDirection()) {
            case "ABOVE", "UP" -> compared >= 0;
            case "BELOW", "DOWN" -> compared <= 0;
            default -> false;
        };
    }

    private boolean throttled(StockAlertRule rule) {
        String key = triggerThrottleKey(rule.getId());
        Boolean absent = redisTemplate.opsForValue().setIfAbsent(
                key,
                String.valueOf(System.currentTimeMillis()),
                Duration.ofSeconds(rule.getThrottleSeconds() == null ? DEFAULT_THROTTLE_SECONDS : rule.getThrottleSeconds()));
        return !Boolean.TRUE.equals(absent);
    }

    private StockAlertHistory saveHistory(StockAlertRule rule, BigDecimal triggerValue) {
        Long now = System.currentTimeMillis();
        StockAlertHistory history = StockAlertHistory.builder()
                .userId(DEFAULT_USER_ID)
                .ruleId(rule.getId())
                .symbol(rule.getSymbol())
                .ruleType(rule.getRuleType())
                .direction(rule.getDirection())
                .targetValue(rule.getTargetValue())
                .triggerValue(triggerValue)
                .message(alertMessage(rule, triggerValue))
                .triggeredAt(now)
                .createdAt(now)
                .build();
        return historyRepository.save(history);
    }

    private void markTriggered(StockAlertRule rule) {
        Long now = System.currentTimeMillis();
        rule.setLastTriggeredAt(now);
        rule.setUpdatedAt(now);
        ruleRepository.save(rule);
    }

    private void markLastEvaluated() {
        redisTemplate.opsForValue().set("stock:alert:last-evaluated:" + DEFAULT_USER_ID, String.valueOf(System.currentTimeMillis()));
    }

    private String alertMessage(StockAlertRule rule, BigDecimal triggerValue) {
        return rule.getSymbol() + " " + rule.getRuleType() + " " + rule.getDirection()
                + " target=" + rule.getTargetValue() + ", actual=" + triggerValue;
    }

    private String triggerThrottleKey(String ruleId) {
        return "stock:alert:triggered:" + DEFAULT_USER_ID + ":" + ruleId;
    }

    private String market(String symbol) {
        return symbol.length() > 2 ? symbol.substring(0, 2) : "";
    }

    private String code(String symbol) {
        return symbol.length() > 2 ? symbol.substring(2) : symbol;
    }
}
