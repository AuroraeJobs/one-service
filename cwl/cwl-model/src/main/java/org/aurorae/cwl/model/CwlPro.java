package org.aurorae.cwl.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class CwlPro extends CwlObject {

    private int order;

    private int pi;
    private int tai;
}
