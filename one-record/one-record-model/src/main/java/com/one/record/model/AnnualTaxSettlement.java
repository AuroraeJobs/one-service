package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnualTaxSettlement {

    private Integer year;
    private Double salaryIncome;
    private Double bonusIncome;
    private Double includedIncome;
    private Double excludedOtherIncome;
    private Double standardDeduction;
    private Double socialInsuranceDeduction;
    private Double totalDeduction;
    private Double taxableIncome;
    private Double taxRate;
    private Double quickDeduction;
    private Double calculatedTax;
    private Double actualTaxPaid;
    private Double difference;
    private Double taxDue;
    private Double taxRefund;
    private Integer bracketLevel;
}
