package org.aurorae.cwl.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@Document("Cwl_Red4")
public class CwlRed4 extends CwlYao {
}
