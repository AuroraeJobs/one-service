package org.aurorae.cwl.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.aurorae.cwl.model.*;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
public class CwlUpdater {

    private List<Cwl> newList;
    private List<CwlValue> cwlValues;
    private CwlGua gua;
    private Long lastId;

    public CwlUpdater() {
        gua = new CwlGua().setGua(new CwlRed(), new CwlRed0(), new CwlRed1(), new CwlRed2(), new CwlRed3(), new CwlRed4(), new CwlRed5(), new CwlBlue());
    }

    public CwlUpdater(List<Cwl> newList, CwlGua gua, Long lastId) {
        this.gua = gua;
        this.lastId = lastId;
        setCwlList(newList);
    }

    public CwlUpdater setCwlList(List<Cwl> newList) {
        newList.sort(Comparator.comparing(CwlObject::getDate));
        this.newList = newList;
        this.cwlValues = newList.stream().map(CwlValue::new).collect(Collectors.toList());
        return this;
    }

    public CwlGua updateGuaByCwl(Cwl cwl) {
        return gua.updateByCwl(cwl);
    }

    public void setValuePr(Long id) {
        cwlValues.stream()
                .filter(cwlValue -> cwlValue.getId().equals(id))
                .findAny()
                .ifPresent(cwlValue -> cwlValue.setPr(gua.sum()));
    }
}
