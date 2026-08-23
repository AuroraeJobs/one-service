package com.one.record.service.impl;

import com.one.common.exception.DuplicateException;
import com.one.record.config.TaxConfig;
import com.one.record.enums.SalaryRecordType;
import com.one.record.model.SalaryRecord;
import com.one.record.repository.SalaryRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SalaryRecordServiceTest {

    private SalaryRecordRepository repository;
    private SalaryRecordService service;

    @BeforeEach
    void setUp() {
        repository = mock(SalaryRecordRepository.class);
        service = new SalaryRecordService(repository, new TaxConfig());
        when(repository.save(any(SalaryRecord.class))).thenAnswer(invocation -> {
            SalaryRecord record = invocation.getArgument(0);
            if (record.getId() == null) {
                record.setId("saved-record");
            }
            return record;
        });
        when(repository.findByYearAndMonth(any(), any())).thenReturn(List.of());
    }

    @Test
    void bonusUsesManualTaxRateWithStandardDeductionOnly() {
        SalaryRecord bonus = SalaryRecord.builder()
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(8)
                .monthlyIncome(10000.0)
                .taxRate(10.0)
                .quickDeduction(100.0)
                .standardDeduction(5000.0)
                .endowmentInsurance(1000.0)
                .build();
        when(repository.findByYearOrderByMonth(2026)).thenReturn(List.of(bonus));
        when(repository.findById("saved-record")).thenReturn(Optional.of(bonus));

        SalaryRecord saved = service.save(bonus);

        assertThat(saved.getSpecialDeduction()).isZero();
        assertThat(saved.getStandardDeduction()).isEqualTo(5000.0);
        assertThat(saved.getEndowmentInsurance()).isZero();
        assertThat(saved.getMonthlyTaxableIncome()).isEqualTo(5000.0);
        assertThat(saved.getQuickDeduction()).isEqualTo(100.0);
        assertThat(saved.getCurrentTaxDeclaration()).isEqualTo(400.0);
        assertThat(saved.getActualIncome()).isEqualTo(9600.0);
        assertThat(saved.getCumulativeTaxableIncome()).isZero();
    }

    @Test
    void bonusDefaultsStandardDeductionToZero() {
        SalaryRecord bonus = SalaryRecord.builder()
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(8)
                .monthlyIncome(10000.0)
                .taxRate(10.0)
                .build();
        when(repository.findByYearOrderByMonth(2026)).thenReturn(List.of(bonus));
        when(repository.findById("saved-record")).thenReturn(Optional.of(bonus));

        SalaryRecord saved = service.save(bonus);

        assertThat(saved.getStandardDeduction()).isZero();
        assertThat(saved.getQuickDeduction()).isZero();
        assertThat(saved.getMonthlyTaxableIncome()).isEqualTo(10000.0);
        assertThat(saved.getCurrentTaxDeclaration()).isEqualTo(1000.0);
    }

    @Test
    void bonusDoesNotEnterSalaryCumulativeTaxCalculation() {
        SalaryRecord januarySalary = salary(1, 5000.0);
        SalaryRecord bonus = SalaryRecord.builder()
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(1)
                .monthlyIncome(10000.0)
                .taxRate(10.0)
                .build();
        SalaryRecord februarySalary = salary(2, 5000.0);
        when(repository.findByYearOrderByMonth(2026)).thenReturn(List.of(januarySalary, bonus, februarySalary));
        when(repository.findById("saved-record")).thenReturn(Optional.of(bonus));

        service.save(bonus);

        assertThat(februarySalary.getCumulativeTaxableIncome()).isEqualTo(10000.0);
        assertThat(februarySalary.getCumulativeTaxPayable()).isEqualTo(300.0);
        assertThat(bonus.getCurrentTaxDeclaration()).isEqualTo(1000.0);
    }

    @Test
    void salaryAndBonusCanShareTheSameMonth() {
        SalaryRecord legacySalary = SalaryRecord.builder().id("salary-1").year(2026).month(8).build();
        SalaryRecord bonus = SalaryRecord.builder()
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(8)
                .monthlyIncome(5000.0)
                .taxRate(3.0)
                .build();
        when(repository.findByYearAndMonth(2026, 8)).thenReturn(List.of(legacySalary));
        when(repository.findByYearOrderByMonth(2026)).thenReturn(List.of(legacySalary, bonus));
        when(repository.findById("saved-record")).thenReturn(Optional.of(bonus));

        SalaryRecord saved = service.save(bonus);

        assertThat(saved.getRecordType()).isEqualTo(SalaryRecordType.BONUS);
    }

    @Test
    void sameRecordTypeCannotRepeatInTheSameMonth() {
        SalaryRecord existingBonus = SalaryRecord.builder()
                .id("bonus-1")
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(8)
                .build();
        SalaryRecord duplicateBonus = SalaryRecord.builder()
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(8)
                .monthlyIncome(5000.0)
                .taxRate(3.0)
                .build();
        when(repository.findByYearAndMonth(2026, 8)).thenReturn(List.of(existingBonus));

        assertThatThrownBy(() -> service.save(duplicateBonus))
                .isInstanceOf(DuplicateException.class)
                .hasMessage("该年月已存在奖金记录，请修改年月或编辑现有记录");
    }

    @Test
    void bonusTaxRateMustBeBetweenZeroAndOneHundred() {
        SalaryRecord bonus = SalaryRecord.builder()
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(8)
                .monthlyIncome(5000.0)
                .taxRate(101.0)
                .build();

        assertThatThrownBy(() -> service.save(bonus))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("奖金税率必须在 0 到 100 之间");
    }

    @Test
    void bonusQuickDeductionCannotBeNegative() {
        SalaryRecord bonus = SalaryRecord.builder()
                .recordType(SalaryRecordType.BONUS)
                .year(2026)
                .month(8)
                .monthlyIncome(5000.0)
                .taxRate(10.0)
                .quickDeduction(-1.0)
                .build();

        assertThatThrownBy(() -> service.save(bonus))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("奖金速算扣除数不能小于 0");
    }

    private SalaryRecord salary(int month, double monthlyTaxableIncome) {
        return SalaryRecord.builder()
                .recordType(SalaryRecordType.SALARY)
                .year(2026)
                .month(month)
                .monthlyIncome(10000.0)
                .specialDeduction(0.0)
                .monthlyTaxableIncome(monthlyTaxableIncome)
                .build();
    }
}
