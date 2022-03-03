package org.aurorae.cwl.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CwlPrizeGrade implements Serializable {

    private String type;

    private String typenum;

    private String typemoney;
}
