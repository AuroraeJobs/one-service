package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "salary_records")
public class SalaryRecord {
    
    @Id
    private String id;
    
    private Integer year;
    
    private Integer month;
    
    private Double monthlyIncome;
    
    private Double standardDeduction;
    
    private Double endowmentInsurance;
    
    private Double medicalInsurance;
    
    private Double unemploymentInsurance;
    
    private Double housingFund;
    
    private Double specialDeduction;
    
    private Double monthlyTaxableIncome;
    
    private Double cumulativeTaxableIncome;
    
    private Double cumulativeTaxPayable;
    
    private Double currentTaxDeclaration;
    
    private Double cumulativeTaxPaid;
    
    private Double actualIncome;
    
    private String notes;
    
    private Long createdAt;
    
    private Long updatedAt;
}
