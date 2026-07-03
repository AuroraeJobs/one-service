package com.one.record.web;

import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockQuote;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StockMarketControllerTest {

    private IStockMarketService stockMarketService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        stockMarketService = mock(IStockMarketService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new StockMarketController(stockMarketService)).build();
    }

    @Test
    void quotesBindsRepeatedSymbolsParams() throws Exception {
        when(stockMarketService.quotes(anyList())).thenReturn(List.of(
                StockQuote.builder()
                        .symbol("sh000001")
                        .name("上证指数")
                        .price(new BigDecimal("3000.00"))
                        .available(true)
                        .build(),
                StockQuote.builder()
                        .symbol("sz399001")
                        .name("深证成指")
                        .price(new BigDecimal("10000.00"))
                        .available(true)
                        .build()
        ));

        mockMvc.perform(get("/stock/quotes")
                        .param("symbols", "sh000001")
                        .param("symbols", "sz399001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].symbol").value("sh000001"))
                .andExpect(jsonPath("$[1].symbol").value("sz399001"));

        ArgumentCaptor<List<String>> symbolsCaptor = ArgumentCaptor.captor();
        verify(stockMarketService).quotes(symbolsCaptor.capture());
        assertThat(symbolsCaptor.getValue()).containsExactly("sh000001", "sz399001");
    }
}
