package org.aurorae.tsdb.opentsdb;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.Accessors;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class ExprQuery {

    private String name;

    private ExprQueryTime time;

    /**
     * Filters the time series emitted in the results. Note that if no filters are specified,
     * all time series for the given metric will be aggregated into the results.
     */
    @JsonProperty("filters")
    private List<Filter> filters;

    private List<ExprQueryMetric> metrics;

    private List<ExprQueryExpression> expressions;
    private List<ExprQueryOutput> outputs;

    public ExprQuery(Object start, Object end) {
        ExprQuery.builder()
                .time(new ExprQueryTime(start, end))
                .build();
    }

    public ExprQuery(Object times) {
        this.time = new ExprQueryTime(times);
    }

    public ExprQuery addItem(Filter item) {
        filters = addItem(filters, item);
        return this;
    }

    public ExprQuery addItem(ExprQueryMetric item) {
        metrics = addItem(metrics, item);
        return this;
    }

    public ExprQuery addItem(ExprQueryExpression item) {
        expressions = addItem(expressions, item);
        return this;
    }

    public ExprQuery addItem(ExprQueryOutput item) {
        outputs = addItem(outputs, item);
        return this;
    }

    public <T> List<T> addItem(List<T> items, T item) {
        if (!CollectionUtils.isEmpty(items)) {
            items.add(item);
        } else {
            items = new ArrayList<>(Collections.singleton(item));
        }
        return items;
    }
}
