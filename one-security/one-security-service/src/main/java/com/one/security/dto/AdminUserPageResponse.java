package com.one.security.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserPageResponse {

    private List<AdminUserSummary> items;
    private long total;
    private int page;
    private int size;
}
