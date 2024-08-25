package org.aurorae.cwl.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BoxOrder {

    private final List<Integer> space = new ArrayList<>();

    private final List<Integer> time = new ArrayList<>();

    public static void move(List<Integer> list, Integer element) {
        list.remove(element);
        list.add(0, element);
    }

    public static BoxOrder one() {
        return new BoxOrder();
    }
}
