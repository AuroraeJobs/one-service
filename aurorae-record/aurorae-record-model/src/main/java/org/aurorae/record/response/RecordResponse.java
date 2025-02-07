package org.aurorae.record.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordResponse {

    private int state;

    private String message;

    private int pageCount;

    private int countNum;

    private List<Record> result;

    public boolean success() {
        return state == 0;
    }
}
