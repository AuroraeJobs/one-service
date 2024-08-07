package org.aurorae.cwl.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@Document("Cwl_Red3")
public class CwlRed3 extends CwlYao {
}
