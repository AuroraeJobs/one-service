package com.one.record.model;

import com.one.record.enums.SalaryCompany;
import com.one.record.enums.SalaryRecordType;
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
    
    private SalaryCompany company;

    private SalaryRecordType recordType;
    
    private Integer year;
    
    private Integer month;
    
    private Double monthlyIncome;
    
    private Double otherIncome;
    
    private Double standardDeduction;
    
    private Double endowmentInsurance;
    
    private Double medicalInsurance;
    
    private Double unemploymentInsurance;
    
    private Double housingFund;
    
    private Double specialDeduction;

    /**
     * 奖金记录手动输入的税率，使用百分比数值（例如 10 表示 10%）
     */
    private Double taxRate;
    
    private Double monthlyTaxableIncome;
    
    private Double cumulativeTaxableIncome;
    
    private Double cumulativeTaxPayable;
    
    private Double currentTaxDeclaration;
    
    private Double cumulativeTaxPaid;
    
    private Double actualIncome;
    
    /**
     * 是否重新累计（跳槽后新公司首月开启，累计应纳税所得额从该月重新开始）
     */
    private Boolean resetCumulative;
    
    private String notes;
    
    private Long createdAt;
    
    private Long updatedAt;
}
