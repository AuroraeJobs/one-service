package org.aurorae.cwl.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CwlResponse {

    private int state;

    private String message;

    private int pageCount;

    private int countNum;

    private List<CwlResult> result;

    public boolean success() {
        return state == 0;
    }
}
