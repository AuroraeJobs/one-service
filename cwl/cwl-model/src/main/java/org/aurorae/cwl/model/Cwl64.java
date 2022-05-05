package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document("Cwl_64")
public class Cwl64 extends CwlObject {

    private long id64;

    private String code64;

    private String label64;

    public Cwl64(Cwl cwl) {
        setBase(cwl.getCode(), cwl.getDate(), cwl.getLastId());
        code64 = "" + (cwl.getRed0() % 2) + (cwl.getRed1() % 2) + (cwl.getRed2() % 2) +
                (cwl.getRed3() % 2) + (cwl.getRed4() % 2) + (cwl.getRed5() % 2);
    }
}
