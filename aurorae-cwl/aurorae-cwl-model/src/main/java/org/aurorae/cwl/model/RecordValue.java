package org.aurorae.cwl.model;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@Document("Cwl_Value")
public class RecordValue extends RecordObject {

    private int d0;
    private int d1;
    private int d2;
    private int d3;
    private int d4;

    private int dum;
    private int rum;
    private int sum;

    private int rvg;
    private int avg;

    private int min;
    private int max;
}
