package com.one.common.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.one.common.util.IdGenerator;
import org.springframework.data.annotation.Id;

import java.io.Serializable;
import java.util.Date;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BaseObject implements Serializable {

    @Id
    private Long id;
    private String code;
    private String name;
    private String label;
    private String remark;
    private Long createBy;
    private Long updateBy;
    private Date createAt;
    private Date updateAt;
    private Map<String, Object> values;

    public BaseObject(Long id) {
        this.id = id;
    }

    public BaseObject(String code) {
        this.code = code;
    }

    public void newId() {
        id = IdGenerator.nextId(this.getClass().getSimpleName());
    }
}
