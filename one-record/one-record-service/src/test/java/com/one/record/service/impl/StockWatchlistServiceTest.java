package com.one.record.service.impl;

import com.one.common.exception.DuplicateException;
import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.repository.StockWatchlistRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.service.IStockUserContext;
import com.one.record.stock.StockWatchlist;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StockWatchlistServiceTest {

    private StockWatchlistRepository repository;

    private IStockMarketService stockMarketService;

    private IStockUserContext userContext;

    private StockWatchlistService service;

    @BeforeEach
    void setUp() {
        repository = mock(StockWatchlistRepository.class);
        stockMarketService = mock(IStockMarketService.class);
        userContext = mock(IStockUserContext.class);
        service = new StockWatchlistService(repository, stockMarketService, userContext);
        lenient().when(userContext.currentUserId()).thenReturn("default");
        lenient().when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        lenient().when(stockMarketService.normalizeSymbol("sh600519")).thenReturn("sh600519");
        lenient().when(stockMarketService.normalizeSymbol("sz000001")).thenReturn("sz000001");
        lenient().when(stockMarketService.market(anyString())).thenAnswer(invocation -> {
            String symbol = invocation.getArgument(0);
            return symbol != null && symbol.length() > 2 ? symbol.substring(0, 2) : "";
        });
        lenient().when(stockMarketService.code(anyString())).thenAnswer(invocation -> {
            String symbol = invocation.getArgument(0);
            return symbol != null && symbol.length() > 2 ? symbol.substring(2) : symbol;
        });
    }

    @Test
    void saveFillsUserMarketCodeSortOrderAndTimestamps() {
        ArgumentCaptor<StockWatchlist> captor = ArgumentCaptor.forClass(StockWatchlist.class);
        when(repository.existsByUserIdAndSymbol("default", "sh600519")).thenReturn(false);
        when(repository.countByUserId("default")).thenReturn(3L);
        when(repository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        StockWatchlist saved = service.save(StockWatchlist.builder()
                .symbol("600519")
                .name(" 贵州茅台 ")
                .build());

        assertThat(saved.getUserId()).isEqualTo("default");
        assertThat(saved.getSymbol()).isEqualTo("sh600519");
        assertThat(saved.getMarket()).isEqualTo("sh");
        assertThat(saved.getCode()).isEqualTo("600519");
        assertThat(saved.getName()).isEqualTo("贵州茅台");
        assertThat(saved.getSortOrder()).isEqualTo(3);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void saveRejectsDuplicateSymbol() {
        when(repository.existsByUserIdAndSymbol("default", "sh600519")).thenReturn(true);

        assertThatThrownBy(() -> service.save(StockWatchlist.builder().symbol("600519").build()))
                .isInstanceOf(DuplicateException.class)
                .hasMessageContaining("自选股已存在");
    }

    @Test
    void saveRejectsBlankSymbol() {
        when(stockMarketService.normalizeSymbol(" ")).thenReturn("");

        assertThatThrownBy(() -> service.save(StockWatchlist.builder().symbol(" ").build()))
                .isInstanceOf(ServiceException.class)
                .hasMessageContaining("股票代码不能为空");
    }

    @Test
    void findAllScopesToCurrentUser() {
        when(userContext.currentUserId()).thenReturn("alice");
        when(repository.findByUserIdOrderBySortOrderAscCreatedAtAsc("alice")).thenReturn(List.of(
                StockWatchlist.builder().userId("alice").symbol("sh600519").build()
        ));

        List<StockWatchlist> items = service.findAll();

        assertThat(items).hasSize(1);
        assertThat(items.get(0).getUserId()).isEqualTo("alice");
        verify(repository).findByUserIdOrderBySortOrderAscCreatedAtAsc("alice");
    }

    @Test
    void deleteRemovesExistingItem() {
        when(repository.findByUserIdAndSymbol("default", "sh600519")).thenReturn(Optional.of(
                StockWatchlist.builder().id("w1").userId("default").symbol("sh600519").build()
        ));

        service.delete("600519");

        verify(repository).deleteById("w1");
    }

    @Test
    void deleteThrowsWhenItemMissing() {
        when(repository.findByUserIdAndSymbol("default", "sh600519")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete("600519"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("自选股不存在");
    }

    @Test
    void updateOrderReassignsSortOrders() {
        StockWatchlist first = StockWatchlist.builder().id("w1").userId("default").symbol("sz000001").sortOrder(5).build();
        StockWatchlist second = StockWatchlist.builder().id("w2").userId("default").symbol("sh600519").sortOrder(6).build();
        when(repository.findByUserIdAndSymbol("default", "sz000001")).thenReturn(Optional.of(first));
        when(repository.findByUserIdAndSymbol("default", "sh600519")).thenReturn(Optional.of(second));
        when(repository.save(any(StockWatchlist.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.findByUserIdOrderBySortOrderAscCreatedAtAsc("default")).thenReturn(List.of(first, second));

        List<StockWatchlist> reordered = service.updateOrder(List.of("sz000001", "sh600519"));

        assertThat(first.getSortOrder()).isEqualTo(0);
        assertThat(second.getSortOrder()).isEqualTo(1);
        assertThat(reordered).hasSize(2);
    }

    @Test
    void updateOrderReturnsCurrentListWhenSymbolsEmpty() {
        when(repository.findByUserIdOrderBySortOrderAscCreatedAtAsc("default")).thenReturn(List.of());

        assertThat(service.updateOrder(List.of())).isEmpty();
        verify(repository).findByUserIdOrderBySortOrderAscCreatedAtAsc("default");
    }
}
