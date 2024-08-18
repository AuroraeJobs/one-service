package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.aurorae.common.util.StreamUtil;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document("Cwl_Base")
public class Cwl extends CwlObject {

    private int red0;
    private int red1;
    private int red2;
    private int red3;
    private int red4;
    private int red5;

    private int blue;

    public Cwl(String code, String date, int red0, int red1, int red2, int red3, int red4, int red5, int blue) {
        super(code, date);
        this.red0 = red0;
        this.red1 = red1;
        this.red2 = red2;
        this.red3 = red3;
        this.red4 = red4;
        this.red5 = red5;
        this.blue = blue;
    }

    public List<Integer> getRed() {
        return Arrays.asList(red0, red1, red2, red3, red4, red5);
    }

    public String getAll() {
        return StreamUtil.joining(Arrays.asList(red0, red1, red2, red3, red4, red5, blue), i -> String.format("%02d", i));
    }
}
