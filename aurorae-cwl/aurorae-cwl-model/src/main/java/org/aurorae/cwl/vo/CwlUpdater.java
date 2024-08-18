package org.aurorae.cwl.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.model.*;
import org.aurorae.cwl.response.CwlResult;

import java.util.Comparator;
import java.util.List;

@Data
@AllArgsConstructor
public class CwlUpdater {

    private List<Cwl> newList;
    private List<CwlResult> resultList;
    private List<CwlValue> cwlValues;
    private CwlGua gua;
    private Long lastId;

    public CwlUpdater() {
        gua = new CwlGua().setGua(new CwlRed(), new CwlRed0(), new CwlRed1(), new CwlRed2(), new CwlRed3(), new CwlRed4(), new CwlRed5(), new CwlBlue());
    }

    public CwlUpdater(List<CwlResult> newList, CwlGua gua, Long lastId) {
        this.gua = gua;
        this.lastId = lastId;
        setCwlList(newList);
    }

    public CwlUpdater setCwlList(List<CwlResult> resultList) {
        resultList.sort(Comparator.comparing(CwlResult::getDate));
        this.resultList = resultList;
        this.newList = StreamUtil.toList(resultList, CwlResult::convertTo);
        this.cwlValues = StreamUtil.toList(this.newList, CwlValue::new);
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
