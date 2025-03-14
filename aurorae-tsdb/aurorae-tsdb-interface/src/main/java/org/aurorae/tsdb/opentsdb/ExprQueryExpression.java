package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ExprQueryExpression {

    private String id;

    private String expr;

    private ExprQueryJoin join;

    private FillPolicy fillPolicy;

    public static ExprQueryExpression create(String id, String expr) {
        return ExprQueryExpression.builder()
                .id(id)
                .expr(expr)
                .join(ExprQueryJoin.defaultJoin())
                .build();
    }
}
