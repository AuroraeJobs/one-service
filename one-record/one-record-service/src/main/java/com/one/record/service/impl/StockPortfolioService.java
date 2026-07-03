package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.repository.StockAccountRepository;
import com.one.record.repository.StockPositionRepository;
import com.one.record.repository.StockTradeRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.service.IStockPortfolioService;
import com.one.record.stock.StockAccount;
import com.one.record.stock.StockHoldingSummary;
import com.one.record.stock.StockPosition;
import com.one.record.stock.StockPortfolioSummary;
import com.one.record.stock.StockQuote;
import com.one.record.stock.StockTrade;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Set;

@Service
@AllArgsConstructor
public class StockPortfolioService implements IStockPortfolioService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String DEFAULT_CURRENCY = "CNY";

    private static final String DEFAULT_STATUS = "ACTIVE";

    private static final Set<String> SUPPORTED_TRADE_TYPES = Set.of(
            "BUY", "SELL", "DIVIDEND", "FEE", "BONUS_SHARE", "SPLIT"
    );

    private final StockAccountRepository accountRepository;

    private final StockPositionRepository positionRepository;

    private final StockTradeRepository tradeRepository;

    private final IStockMarketService stockMarketService;

    @Override
    public List<StockAccount> accounts() {
        return accountRepository.findByUserIdOrderByCreatedAtAsc(DEFAULT_USER_ID);
    }

    @Override
    public StockAccount saveAccount(StockAccount account) {
        if (account == null) {
            throw new ServiceException("股票账户不能为空");
        }
        Long now = System.currentTimeMillis();
        StockAccount target = StockAccount.builder()
                .userId(DEFAULT_USER_ID)
                .createdAt(now)
                .updatedAt(now)
                .build();
        copyAccount(account, target);
        return accountRepository.save(target);
    }

    @Override
    public StockAccount updateAccount(String id, StockAccount account) {
        if (account == null) {
            throw new ServiceException("股票账户不能为空");
        }
        StockAccount target = accountRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票账户不存在: {}", id));
        copyAccount(account, target);
        target.setUpdatedAt(System.currentTimeMillis());
        return accountRepository.save(target);
    }

    @Override
    public void deleteAccount(String id) {
        StockAccount existing = accountRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票账户不存在: {}", id));
        accountRepository.deleteById(existing.getId());
    }

    @Override
    public List<StockPosition> positions(String accountId) {
        if (StringUtils.hasText(accountId)) {
            return positionRepository.findByUserIdAndAccountIdOrderBySymbolAscCreatedAtAsc(DEFAULT_USER_ID, accountId.trim());
        }
        return positionRepository.findByUserIdOrderBySymbolAscCreatedAtAsc(DEFAULT_USER_ID);
    }

    @Override
    public StockPosition savePosition(StockPosition position) {
        if (position == null) {
            throw new ServiceException("股票持仓不能为空");
        }
        Long now = System.currentTimeMillis();
        StockPosition target = StockPosition.builder()
                .userId(DEFAULT_USER_ID)
                .createdAt(now)
                .updatedAt(now)
                .build();
        copyPosition(position, target);
        return positionRepository.save(target);
    }

    @Override
    public StockPosition updatePosition(String id, StockPosition position) {
        if (position == null) {
            throw new ServiceException("股票持仓不能为空");
        }
        StockPosition target = positionRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票持仓不存在: {}", id));
        copyPosition(position, target);
        target.setUpdatedAt(System.currentTimeMillis());
        return positionRepository.save(target);
    }

    @Override
    public void deletePosition(String id) {
        StockPosition existing = positionRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票持仓不存在: {}", id));
        positionRepository.deleteById(existing.getId());
    }

    @Override
    public List<StockPosition> recalculatePositions(String accountId) {
        List<StockTrade> trades = StringUtils.hasText(accountId)
                ? tradeRepository.findByUserIdAndAccountIdOrderByTradedAtDescCreatedAtDesc(DEFAULT_USER_ID, accountId.trim())
                : tradeRepository.findByUserIdOrderByTradedAtDescCreatedAtDesc(DEFAULT_USER_ID);
        List<PositionKey> keys = trades.stream()
                .filter(trade -> StringUtils.hasText(trade.getSymbol()))
                .map(trade -> new PositionKey(trimToNull(trade.getAccountId()), trade.getSymbol()))
                .distinct()
                .toList();
        List<StockPosition> recalculated = new ArrayList<>();
        for (PositionKey key : keys) {
            recalculated.add(recalculatePositionByNormalizedSymbol(key.accountId(), key.symbol()));
        }
        return recalculated;
    }

    @Override
    public StockPosition recalculatePosition(String accountId, String symbol) {
        return recalculatePositionByNormalizedSymbol(trimToNull(accountId), normalizeRequiredSymbol(symbol));
    }

    @Override
    public List<StockTrade> trades(String accountId, String symbol) {
        if (StringUtils.hasText(symbol)) {
            return tradeRepository.findByUserIdAndSymbolOrderByTradedAtDescCreatedAtDesc(
                    DEFAULT_USER_ID, stockMarketService.normalizeSymbol(symbol));
        }
        if (StringUtils.hasText(accountId)) {
            return tradeRepository.findByUserIdAndAccountIdOrderByTradedAtDescCreatedAtDesc(DEFAULT_USER_ID, accountId.trim());
        }
        return tradeRepository.findByUserIdOrderByTradedAtDescCreatedAtDesc(DEFAULT_USER_ID);
    }

    @Override
    public StockTrade saveTrade(StockTrade trade) {
        if (trade == null) {
            throw new ServiceException("股票交易不能为空");
        }
        Long now = System.currentTimeMillis();
        StockTrade target = StockTrade.builder()
                .userId(DEFAULT_USER_ID)
                .createdAt(now)
                .updatedAt(now)
                .build();
        copyTrade(trade, target);
        StockTrade saved = tradeRepository.save(target);
        recalculatePositionForTrade(saved);
        return saved;
    }

    @Override
    public StockTrade updateTrade(String id, StockTrade trade) {
        if (trade == null) {
            throw new ServiceException("股票交易不能为空");
        }
        StockTrade target = tradeRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票交易不存在: {}", id));
        String oldAccountId = trimToNull(target.getAccountId());
        String oldSymbol = target.getSymbol();
        copyTrade(trade, target);
        target.setUpdatedAt(System.currentTimeMillis());
        StockTrade saved = tradeRepository.save(target);
        recalculatePositionForTrade(saved);
        if (!samePositionKey(oldAccountId, oldSymbol, saved)) {
            recalculatePositionByNormalizedSymbol(oldAccountId, oldSymbol);
        }
        return saved;
    }

    @Override
    public void deleteTrade(String id) {
        StockTrade existing = tradeRepository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("股票交易不存在: {}", id));
        tradeRepository.deleteById(existing.getId());
        recalculatePositionForTrade(existing);
    }

    @Override
    public StockPortfolioSummary summary() {
        List<StockPosition> positions = positionRepository.findByUserIdOrderBySymbolAscCreatedAtAsc(DEFAULT_USER_ID);
        if (positions.isEmpty()) {
            return StockPortfolioSummary.builder()
                    .totalMarketValue(BigDecimal.ZERO)
                    .totalCostAmount(BigDecimal.ZERO)
                    .floatingPnl(BigDecimal.ZERO)
                    .floatingPnlPercent(BigDecimal.ZERO)
                    .todayPnl(BigDecimal.ZERO)
                    .holdingCount(0)
                    .calculatedAt(System.currentTimeMillis())
                    .holdings(List.of())
                    .build();
        }

        Map<String, StockQuote> quoteMap = stockMarketService.quotes(positions.stream()
                        .map(StockPosition::getSymbol)
                        .filter(StringUtils::hasText)
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(StockQuote::getSymbol, Function.identity(), (left, right) -> left));
        List<StockHoldingSummary> holdings = positions.stream()
                .map(position -> toHoldingSummary(position, quoteMap.get(position.getSymbol())))
                .sorted(Comparator.comparing(StockHoldingSummary::getMarketValue, Comparator.nullsLast(BigDecimal::compareTo)).reversed()
                        .thenComparing(StockHoldingSummary::getSymbol, Comparator.nullsLast(String::compareTo)))
                .toList();

        BigDecimal totalMarketValue = sum(holdings, StockHoldingSummary::getMarketValue);
        BigDecimal totalCostAmount = sum(holdings, StockHoldingSummary::getCostAmount);
        BigDecimal floatingPnl = totalMarketValue.subtract(totalCostAmount);
        return StockPortfolioSummary.builder()
                .totalMarketValue(scaleMoney(totalMarketValue))
                .totalCostAmount(scaleMoney(totalCostAmount))
                .floatingPnl(scaleMoney(floatingPnl))
                .floatingPnlPercent(percent(floatingPnl, totalCostAmount))
                .todayPnl(scaleMoney(sum(holdings, StockHoldingSummary::getTodayPnl)))
                .holdingCount(holdings.size())
                .calculatedAt(System.currentTimeMillis())
                .holdings(holdings)
                .build();
    }

    private void copyAccount(StockAccount source, StockAccount target) {
        if (!StringUtils.hasText(source.getName())) {
            throw new ServiceException("股票账户名称不能为空");
        }
        target.setName(source.getName().trim());
        target.setBroker(trimToNull(source.getBroker()));
        target.setAccountNo(trimToNull(source.getAccountNo()));
        target.setCurrency(StringUtils.hasText(source.getCurrency()) ? source.getCurrency().trim().toUpperCase() : DEFAULT_CURRENCY);
        target.setCashBalance(defaultAmount(source.getCashBalance()));
        target.setStatus(StringUtils.hasText(source.getStatus()) ? source.getStatus().trim().toUpperCase() : DEFAULT_STATUS);
    }

    private void copyPosition(StockPosition source, StockPosition target) {
        String symbol = normalizeRequiredSymbol(source.getSymbol());
        target.setAccountId(trimToNull(source.getAccountId()));
        target.setSymbol(symbol);
        target.setMarket(market(symbol));
        target.setCode(code(symbol));
        target.setName(trimToNull(source.getName()));
        target.setQuantity(defaultAmount(source.getQuantity()));
        target.setAvailableQuantity(defaultAmount(source.getAvailableQuantity()));
        target.setCostPrice(defaultAmount(source.getCostPrice()));
        target.setCostAmount(defaultAmount(source.getCostAmount()));
        target.setOpenedAt(source.getOpenedAt() == null ? System.currentTimeMillis() : source.getOpenedAt());
    }

    private void copyTrade(StockTrade source, StockTrade target) {
        String tradeType = StringUtils.hasText(source.getTradeType()) ? source.getTradeType().trim().toUpperCase() : "";
        if (!SUPPORTED_TRADE_TYPES.contains(tradeType)) {
            throw new ServiceException("不支持的股票交易类型: {}", tradeType);
        }
        String symbol = normalizeRequiredSymbol(source.getSymbol());
        target.setAccountId(trimToNull(source.getAccountId()));
        target.setSymbol(symbol);
        target.setMarket(market(symbol));
        target.setCode(code(symbol));
        target.setName(trimToNull(source.getName()));
        target.setTradeType(tradeType);
        target.setQuantity(defaultAmount(source.getQuantity()));
        target.setPrice(defaultAmount(source.getPrice()));
        target.setAmount(defaultAmount(source.getAmount()));
        target.setFee(defaultAmount(source.getFee()));
        target.setTax(defaultAmount(source.getTax()));
        target.setTradedAt(source.getTradedAt() == null ? System.currentTimeMillis() : source.getTradedAt());
        target.setRemark(trimToNull(source.getRemark()));
    }

    private void recalculatePositionForTrade(StockTrade trade) {
        if (trade == null || !StringUtils.hasText(trade.getSymbol())) {
            return;
        }
        recalculatePositionByNormalizedSymbol(trimToNull(trade.getAccountId()), trade.getSymbol());
    }

    private StockPosition recalculatePositionByNormalizedSymbol(String accountId, String symbol) {
        if (!StringUtils.hasText(symbol)) {
            throw new ServiceException("股票代码不能为空");
        }
        String normalizedAccountId = trimToNull(accountId);
        List<StockTrade> trades = normalizedAccountId == null
                ? tradeRepository.findByUserIdAndAccountIdIsNullAndSymbolOrderByTradedAtAscCreatedAtAsc(DEFAULT_USER_ID, symbol)
                : tradeRepository.findByUserIdAndAccountIdAndSymbolOrderByTradedAtAscCreatedAtAsc(DEFAULT_USER_ID, normalizedAccountId, symbol);
        StockPosition existing = findPosition(normalizedAccountId, symbol).orElse(null);
        Long now = System.currentTimeMillis();
        StockPosition target = existing == null
                ? StockPosition.builder()
                .userId(DEFAULT_USER_ID)
                .accountId(normalizedAccountId)
                .symbol(symbol)
                .market(market(symbol))
                .code(code(symbol))
                .createdAt(now)
                .openedAt(firstTradeTime(trades, now))
                .build()
                : existing;

        PositionAmounts amounts = calculatePositionAmounts(trades);
        String positionName = trades.stream()
                .map(StockTrade::getName)
                .filter(StringUtils::hasText)
                .reduce((first, second) -> second)
                .orElse(target.getName());
        target.setUserId(DEFAULT_USER_ID);
        target.setAccountId(normalizedAccountId);
        target.setSymbol(symbol);
        target.setMarket(market(symbol));
        target.setCode(code(symbol));
        target.setName(trimToNull(positionName));
        target.setQuantity(scaleQuantity(amounts.quantity()));
        target.setAvailableQuantity(scaleQuantity(amounts.quantity()));
        target.setCostAmount(scaleMoney(amounts.costAmount()));
        target.setCostPrice(weightedCostPrice(amounts.costAmount(), amounts.quantity()));
        target.setOpenedAt(target.getOpenedAt() == null ? firstTradeTime(trades, now) : target.getOpenedAt());
        target.setUpdatedAt(now);
        return positionRepository.save(target);
    }

    private PositionAmounts calculatePositionAmounts(List<StockTrade> trades) {
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal costAmount = BigDecimal.ZERO;
        for (StockTrade trade : trades) {
            String tradeType = trade.getTradeType();
            BigDecimal tradeQuantity = defaultAmount(trade.getQuantity());
            BigDecimal feeAndTax = defaultAmount(trade.getFee()).add(defaultAmount(trade.getTax()));
            if ("BUY".equals(tradeType)) {
                quantity = quantity.add(tradeQuantity);
                costAmount = costAmount.add(tradeAmount(trade)).add(feeAndTax);
            } else if ("SELL".equals(tradeType)) {
                BigDecimal soldQuantity = tradeQuantity.min(quantity);
                BigDecimal costBasis = averageCost(costAmount, quantity).multiply(soldQuantity);
                quantity = quantity.subtract(soldQuantity);
                costAmount = costAmount.subtract(costBasis);
            } else if ("FEE".equals(tradeType)) {
                costAmount = costAmount.add(tradeAmount(trade)).add(feeAndTax);
            } else if ("BONUS_SHARE".equals(tradeType)) {
                quantity = quantity.add(tradeQuantity);
            } else if ("SPLIT".equals(tradeType)) {
                BigDecimal ratio = tradeQuantity.compareTo(BigDecimal.ZERO) > 0 ? tradeQuantity : defaultAmount(trade.getPrice());
                if (ratio.compareTo(BigDecimal.ZERO) > 0) {
                    quantity = quantity.multiply(ratio);
                }
            }
            if (quantity.compareTo(BigDecimal.ZERO) == 0) {
                costAmount = BigDecimal.ZERO;
            }
        }
        return new PositionAmounts(quantity.max(BigDecimal.ZERO), costAmount.max(BigDecimal.ZERO));
    }

    private java.util.Optional<StockPosition> findPosition(String accountId, String symbol) {
        return accountId == null
                ? positionRepository.findByUserIdAndAccountIdIsNullAndSymbol(DEFAULT_USER_ID, symbol)
                : positionRepository.findByUserIdAndAccountIdAndSymbol(DEFAULT_USER_ID, accountId, symbol);
    }

    private Long firstTradeTime(List<StockTrade> trades, Long fallback) {
        return trades.stream()
                .map(StockTrade::getTradedAt)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(fallback);
    }

    private boolean samePositionKey(String oldAccountId, String oldSymbol, StockTrade saved) {
        return Objects.equals(trimToNull(oldAccountId), trimToNull(saved.getAccountId()))
                && Objects.equals(oldSymbol, saved.getSymbol());
    }

    private BigDecimal tradeAmount(StockTrade trade) {
        BigDecimal amount = defaultAmount(trade.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            return amount;
        }
        return defaultAmount(trade.getQuantity()).multiply(defaultAmount(trade.getPrice()));
    }

    private BigDecimal averageCost(BigDecimal costAmount, BigDecimal quantity) {
        if (defaultAmount(quantity).compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return defaultAmount(costAmount).divide(quantity, 10, RoundingMode.HALF_UP);
    }

    private BigDecimal weightedCostPrice(BigDecimal costAmount, BigDecimal quantity) {
        if (defaultAmount(quantity).compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return defaultAmount(costAmount).divide(quantity, 2, RoundingMode.HALF_UP);
    }

    private String normalizeRequiredSymbol(String symbol) {
        String normalizedSymbol = stockMarketService.normalizeSymbol(symbol);
        if (!StringUtils.hasText(normalizedSymbol)) {
            throw new ServiceException("股票代码不能为空");
        }
        return normalizedSymbol;
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private StockHoldingSummary toHoldingSummary(StockPosition position, StockQuote quote) {
        BigDecimal quantity = defaultAmount(position.getQuantity());
        BigDecimal costAmount = defaultAmount(position.getCostAmount());
        BigDecimal latestPrice = quotePrice(quote);
        BigDecimal marketValue = quantity.multiply(latestPrice);
        BigDecimal floatingPnl = marketValue.subtract(costAmount);
        BigDecimal todayPnl = quantity.multiply(defaultAmount(quote == null ? null : quote.getChangeAmount()));
        return StockHoldingSummary.builder()
                .positionId(position.getId())
                .accountId(position.getAccountId())
                .symbol(position.getSymbol())
                .market(position.getMarket())
                .code(position.getCode())
                .name(StringUtils.hasText(position.getName()) ? position.getName() : quoteName(quote, position.getSymbol()))
                .quantity(scaleQuantity(quantity))
                .costPrice(scaleMoney(position.getCostPrice()))
                .costAmount(scaleMoney(costAmount))
                .latestPrice(scaleMoney(latestPrice))
                .changeAmount(scaleMoney(quote == null ? null : quote.getChangeAmount()))
                .changePercent(scalePercent(quote == null ? null : quote.getChangePercent()))
                .marketValue(scaleMoney(marketValue))
                .floatingPnl(scaleMoney(floatingPnl))
                .floatingPnlPercent(percent(floatingPnl, costAmount))
                .todayPnl(scaleMoney(todayPnl))
                .quoteAvailable(quote != null && Boolean.TRUE.equals(quote.getAvailable()))
                .stale(quote != null && Boolean.TRUE.equals(quote.getStale()))
                .build();
    }

    private BigDecimal quotePrice(StockQuote quote) {
        if (quote == null || !Boolean.TRUE.equals(quote.getAvailable())) {
            return BigDecimal.ZERO;
        }
        return defaultAmount(quote.getPrice());
    }

    private String quoteName(StockQuote quote, String fallback) {
        return quote != null && StringUtils.hasText(quote.getName()) ? quote.getName() : fallback;
    }

    private BigDecimal sum(List<StockHoldingSummary> holdings, Function<StockHoldingSummary, BigDecimal> mapper) {
        return holdings.stream()
                .map(mapper)
                .map(this::defaultAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
        BigDecimal safeDenominator = defaultAmount(denominator);
        if (safeDenominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return defaultAmount(numerator).multiply(BigDecimal.valueOf(100)).divide(safeDenominator, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return defaultAmount(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scalePercent(BigDecimal value) {
        return defaultAmount(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleQuantity(BigDecimal value) {
        return defaultAmount(value).setScale(4, RoundingMode.HALF_UP).stripTrailingZeros();
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

    private record PositionKey(String accountId, String symbol) {
    }

    private record PositionAmounts(BigDecimal quantity, BigDecimal costAmount) {
    }
}
