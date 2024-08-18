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

    private List<Cwl> cwlList;
    private List<CwlResult> resultList;
    private List<CwlValue> valueList;
    private CwlGua gua;
    private Long lastId;

    public CwlUpdater() {
        gua = new CwlGua().setGua(new CwlRed(), new CwlRed0(), new CwlRed1(), new CwlRed2(), new CwlRed3(), new CwlRed4(), new CwlRed5(), new CwlBlue());
    }

    public CwlUpdater(List<CwlResult> cwlList, CwlGua gua, Long lastId) {
        this.gua = gua;
        this.lastId = lastId;
        setCwlList(cwlList);
    }

    public CwlUpdater setCwlList(List<CwlResult> resultList) {
        resultList.sort(Comparator.comparing(CwlResult::getDate));
        this.resultList = resultList;
        this.cwlList = StreamUtil.toList(resultList, CwlResult::convertTo);
        this.valueList = StreamUtil.toList(this.cwlList, CwlValue::new);
        return this;
    }

    public CwlGua updateGuaByCwl(Cwl cwl) {
        return gua.updateByCwl(cwl);
    }

    public void setValuePr(Long id) {
        valueList.stream()
                .filter(cwlValue -> cwlValue.getId().equals(id))
                .findAny()
                .ifPresent(cwlValue -> cwlValue.setPr(gua.sum()));
    }
}
