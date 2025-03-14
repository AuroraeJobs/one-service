package org.aurorae.tsdb.opentsdb;


import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExprQueryJoin {

    private String operator;

    private boolean useQueryTags;

    private boolean includeAggTags = true;

    public static ExprQueryJoin defaultJoin() {
        return ExprQueryJoin.builder()
                .operator(JoinOperator.UNION.name)
                .useQueryTags(true)
                .includeAggTags(false)
                .build();
    }

    public enum JoinOperator {
        UNION("union"), INTERSECTION("intersection"), CROSS("cross");

        JoinOperator(String name) {
            this.name = name;
        }

        @Getter
        public final String name;
    }
}
