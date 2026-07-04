package com.one.record.web;

import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.service.ILotteryProviderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryProviderControllerTest {

    private ILotteryProviderService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryProviderService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryProviderController(service)).build();
    }

    @Test
    void healthDelegatesToService() throws Exception {
        when(service.health()).thenReturn(List.of(LotteryProviderHealth.builder()
                .category("draw")
                .provider("cwl")
                .active(true)
                .registered(true)
                .status("REGISTERED")
                .checkedAt(100L)
                .build()));

        mockMvc.perform(get("/lottery/providers/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("draw"))
                .andExpect(jsonPath("$[0].provider").value("cwl"))
                .andExpect(jsonPath("$[0].active").value(true))
                .andExpect(jsonPath("$[0].status").value("REGISTERED"));

        verify(service).health();
    }

    @Test
    void configDelegatesToService() throws Exception {
        when(service.config()).thenReturn(LotteryProviderConfig.builder()
                .activeDrawProvider("cwl")
                .registeredDrawProviders(List.of("cwl"))
                .scheduledSyncEnabled(true)
                .generatedAt(100L)
                .build());

        mockMvc.perform(get("/lottery/providers/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeDrawProvider").value("cwl"))
                .andExpect(jsonPath("$.registeredDrawProviders[0]").value("cwl"))
                .andExpect(jsonPath("$.scheduledSyncEnabled").value(true));

        verify(service).config();
    }
}
