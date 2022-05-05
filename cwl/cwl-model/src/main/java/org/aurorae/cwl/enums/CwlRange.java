package org.aurorae.cwl.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum CwlRange {

    RED0("red0", 1, 28),
    RED1("red1", 2, 29),
    RED2("red2", 3, 30),
    RED3("red3", 4, 31),
    RED4("red4", 5, 32),
    RED5("red5", 6, 33),
    BLUE("blue", 1, 16);

    private final String name;
    private final int min;
    private final int max;

    public int random() {
        return (int) (Math.random() * (max - min) + min);
    }
}
