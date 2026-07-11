package com.one.record.service.impl;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.lottery.LotteryStrategyNoteAttachRequest;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryStrategyNote;
import com.one.record.model.LotteryStrategyNoteEvidence;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryStrategyNoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryStrategyNoteServiceTest {

    private LotteryStrategyNoteRepository repository;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryBacktestReportRepository backtestReportRepository;

    private LotteryStrategyNoteService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryStrategyNoteRepository.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        backtestReportRepository = mock(LotteryBacktestReportRepository.class);
        service = new LotteryStrategyNoteService(repository, auditEventRepository, backtestReportRepository);
        when(repository.save(any(LotteryStrategyNote.class))).thenAnswer(invocation -> {
            LotteryStrategyNote note = invocation.getArgument(0);
            if (note.getId() == null) {
                note.setId("note-1");
            }
            return note;
        });
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void notesReturnsActiveStatusPage() {
        when(repository.countByUserIdAndStatusAndArchivedFalse("default", "ACTIVE")).thenReturn(1L);
        when(repository.findByUserIdAndStatusAndArchivedFalseOrderByUpdatedAtDesc("default", "ACTIVE", PageRequest.of(0, 20)))
                .thenReturn(List.of(LotteryStrategyNote.builder().id("note-1").status("ACTIVE").build()));

        LotteryPageResponse<LotteryStrategyNote> result = service.notes(false, "active", 1, 20);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getTotal()).isEqualTo(1L);
        verify(repository).findByUserIdAndStatusAndArchivedFalseOrderByUpdatedAtDesc("default", "ACTIVE", PageRequest.of(0, 20));
    }

    @Test
    void createNormalizesEvidenceAndWritesAuditEvent() {
        ArgumentCaptor<LotteryStrategyNote> noteCaptor = ArgumentCaptor.forClass(LotteryStrategyNote.class);
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);

        LotteryStrategyNote saved = service.create(LotteryStrategyNote.builder()
                .title("  稳态蓝球假设  ")
                .status("active")
                .tags(List.of(" 稳态 ", "稳态", " 蓝球 "))
                .evidence(List.of(LotteryStrategyNoteEvidence.builder()
                        .evidenceKey(" decision:1 ")
                        .evidenceType("decision")
                        .title(" 决策复盘 ")
                        .build()))
                .build());

        verify(repository).save(noteCaptor.capture());
        verify(auditEventRepository).save(auditCaptor.capture());
        assertThat(saved.getId()).isEqualTo("note-1");
        assertThat(noteCaptor.getValue().getTitle()).isEqualTo("稳态蓝球假设");
        assertThat(noteCaptor.getValue().getStatus()).isEqualTo("ACTIVE");
        assertThat(noteCaptor.getValue().getTags()).containsExactly("稳态", "蓝球");
        assertThat(noteCaptor.getValue().getEvidence()).hasSize(1);
        assertThat(auditCaptor.getValue().getEventType()).isEqualTo("STRATEGY_NOTE_CREATE");
    }

    @Test
    void attachEvidenceReplacesExistingEvidenceKeyAndWritesAuditEvent() {
        when(repository.findByIdAndUserId("note-1", "default")).thenReturn(Optional.of(LotteryStrategyNote.builder()
                .id("note-1")
                .userId("default")
                .title("策略")
                .createdAt(1L)
                .evidence(List.of(LotteryStrategyNoteEvidence.builder().evidenceKey("decision:1").title("旧").build()))
                .build()));

        LotteryStrategyNote saved = service.attachEvidence("note-1", LotteryStrategyNoteAttachRequest.builder()
                .evidence(LotteryStrategyNoteEvidence.builder()
                        .evidenceKey("decision:1")
                        .evidenceType("decision")
                        .title("新")
                        .build())
                .build());

        assertThat(saved.getEvidence()).hasSize(1);
        assertThat(saved.getEvidence().get(0).getTitle()).isEqualTo("新");
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        verify(auditEventRepository).save(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getEventType()).isEqualTo("STRATEGY_NOTE_ATTACH_EVIDENCE");
    }

    @Test
    void attachBacktestEvidenceUsesServerSideProvenance() {
        LotteryResearchProvenance serverProvenance = LotteryResearchProvenance.builder()
                .batchId("batch-server")
                .runId("run-server")
                .build();
        when(repository.findByIdAndUserId("note-1", "default")).thenReturn(Optional.of(LotteryStrategyNote.builder()
                .id("note-1")
                .userId("default")
                .createdAt(1L)
                .build()));
        when(backtestReportRepository.findById("backtest-1")).thenReturn(Optional.of(LotteryBacktestReport.builder()
                .id("backtest-1")
                .provenance(serverProvenance)
                .build()));

        LotteryStrategyNote saved = service.attachEvidence("note-1", LotteryStrategyNoteAttachRequest.builder()
                .evidence(LotteryStrategyNoteEvidence.builder()
                        .evidenceKey("backtest:backtest-1")
                        .evidenceType("backtest")
                        .sourceId(" backtest-1 ")
                        .provenance(List.of(LotteryResearchProvenance.builder().batchId("client-value").build()))
                        .build())
                .build());

        assertThat(saved.getEvidence()).singleElement().satisfies(evidence -> {
            assertThat(evidence.getEvidenceType()).isEqualTo("BACKTEST");
            assertThat(evidence.getSourceId()).isEqualTo("backtest-1");
            assertThat(evidence.getProvenance()).containsExactly(serverProvenance);
        });
    }

    @Test
    void updateKeepsNormalizedGenericEvidenceProvenance() {
        LotteryResearchProvenance provenance = LotteryResearchProvenance.builder()
                .generationId("generation-1")
                .build();
        when(repository.findByIdAndUserId("note-1", "default")).thenReturn(Optional.of(LotteryStrategyNote.builder()
                .id("note-1")
                .userId("default")
                .title("旧标题")
                .createdAt(1L)
                .build()));

        LotteryStrategyNote saved = service.update("note-1", LotteryStrategyNote.builder()
                .title("新标题")
                .evidence(List.of(LotteryStrategyNoteEvidence.builder()
                        .evidenceKey(" generation:1 ")
                        .evidenceType("generation")
                        .provenance(List.of(provenance, provenance))
                        .build()))
                .build());

        assertThat(saved.getEvidence()).singleElement().satisfies(evidence -> {
            assertThat(evidence.getEvidenceKey()).isEqualTo("generation:1");
            assertThat(evidence.getEvidenceType()).isEqualTo("GENERATION");
            assertThat(evidence.getProvenance()).containsExactly(provenance);
        });
    }
}
