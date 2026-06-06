package com.one.record.config;

import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Getter
public class TaxConfig {
    
    /**
     * 级数1: 不超过36000元的部分
     */
    private static final TaxBracket BRACKET_1 = new TaxBracket(1, 0, 36000, 0.03, 0);
    
    /**
     * 级数2: 超过36000元至144000元的部分
     */
    private static final TaxBracket BRACKET_2 = new TaxBracket(2, 36000, 144000, 0.10, 2520);
    
    /**
     * 级数3: 超过144000元至300000元的部分
     */
    private static final TaxBracket BRACKET_3 = new TaxBracket(3, 144000, 300000, 0.20, 16920);
    
    /**
     * 级数4: 超过300000元至420000元的部分
     */
    private static final TaxBracket BRACKET_4 = new TaxBracket(4, 300000, 420000, 0.25, 31920);
    
    /**
     * 级数5: 超过420000元至660000元的部分
     */
    private static final TaxBracket BRACKET_5 = new TaxBracket(5, 420000, 660000, 0.30, 52920);
    
    /**
     * 级数6: 超过660000元至960000元的部分
     */
    private static final TaxBracket BRACKET_6 = new TaxBracket(6, 660000, 960000, 0.35, 85920);
    
    /**
     * 级数7: 超过960000元的部分
     */
    private static final TaxBracket BRACKET_7 = new TaxBracket(7, 960000, Double.MAX_VALUE, 0.45, 181920);
    
    /**
     * 个税税率表
     */
    private final List<TaxBracket> brackets = Arrays.asList(BRACKET_1, BRACKET_2, BRACKET_3, BRACKET_4, BRACKET_5, BRACKET_6, BRACKET_7);
    
    /**
     * 每月减除费用（起征点）
     */
    private final double standardDeductionPerMonth = 5000.0;
    
    /**
     * 根据累计应纳税所得额计算应纳税额
     */
    public double calculateTax(double cumulativeTaxableIncome) {
        if (cumulativeTaxableIncome <= 0) {
            return 0.0;
        }
        
        for (int i = brackets.size() - 1; i >= 0; i--) {
            TaxBracket bracket = brackets.get(i);
            if (cumulativeTaxableIncome > bracket.getLowerBound()) {
                double tax = cumulativeTaxableIncome * bracket.getTaxRate() - bracket.getQuickDeduction();
                return Math.max(0, tax);
            }
        }
        
        return 0.0;
    }
    
    /**
     * 获取适用的税级
     */
    public TaxBracket getApplicableBracket(double cumulativeTaxableIncome) {
        if (cumulativeTaxableIncome <= 0) {
            return BRACKET_1;
        }
        
        for (int i = brackets.size() - 1; i >= 0; i--) {
            TaxBracket bracket = brackets.get(i);
            if (cumulativeTaxableIncome > bracket.getLowerBound()) {
                return bracket;
            }
        }
        
        return BRACKET_1;
    }
    
    /**
     * 个税税率级次配置
     */
    @Getter
    public static class TaxBracket {
        /**
         * 级数
         */
        private final int level;
        
        /**
         * 本级下限（不含）
         */
        private final double lowerBound;
        
        /**
         * 本级上限（含）
         */
        private final double upperBound;
        
        /**
         * 税率
         */
        private final double taxRate;
        
        /**
         * 速算扣除数
         */
        private final double quickDeduction;
        
        public TaxBracket(int level, double lowerBound, double upperBound, double taxRate, double quickDeduction) {
            this.level = level;
            this.lowerBound = lowerBound;
            this.upperBound = upperBound;
            this.taxRate = taxRate;
            this.quickDeduction = quickDeduction;
        }
        
        @Override
        public String toString() {
            return String.format("第%d级: %.0f-%.0f元, 税率%.1f%%, 速算扣除数%.0f", 
                level, lowerBound, upperBound == Double.MAX_VALUE ? 0 : upperBound, 
                taxRate * 100, quickDeduction);
        }
    }
}
