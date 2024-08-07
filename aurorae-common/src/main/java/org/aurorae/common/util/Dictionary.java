package org.aurorae.common.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.List;

/**
 * 字典表
 *
 * @author aurorae
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Dictionary {
    private String label;
    private Long value;
    private boolean disabled;
    private boolean expand = true;
    private String type;
    private List<Dictionary> children;
}
