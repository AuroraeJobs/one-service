package com.one.record.api;

import java.util.List;

public interface TreeNode extends Node {

    List<TreeNode> getChildren();

    void setChildren(List<TreeNode> children);
}
