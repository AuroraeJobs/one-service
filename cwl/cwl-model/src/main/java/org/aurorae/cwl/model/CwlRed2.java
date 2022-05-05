package org.aurorae.cwl.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@Document("Cwl_Red2")
public class CwlRed2 extends CwlYao {
}
