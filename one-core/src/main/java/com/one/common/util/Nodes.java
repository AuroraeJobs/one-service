package com.one.common.util;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * @author aurorae
 */
@Data
public class Nodes implements Serializable {
    private static final long serialVersionUID = 1L;

    protected int id;
    protected int parentId;
    protected List<Nodes> children = new ArrayList<>(16);

    public void add(Nodes node) {
        children.add(node);
    }
}
