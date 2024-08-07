package org.aurorae.cwl.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CwlGua extends CwlObject {

    private Cwl cwl;

    private CwlRed red;
    private CwlRed0 red0;
    private CwlRed1 red1;
    private CwlRed2 red2;
    private CwlRed3 red3;
    private CwlRed4 red4;
    private CwlRed5 red5;
    private CwlBlue blue;

    public CwlGua(Cwl cwl) {
        super(cwl.getCode(), cwl.getDate(), cwl.getLastId());
        this.cwl = cwl;
    }

    public CwlGua setGua(CwlRed red, CwlRed0 red0, CwlRed1 red1, CwlRed2 red2, CwlRed3 red3, CwlRed4 red4, CwlRed5 red5, CwlBlue blue) {
        this.red = red;
        this.red0 = red0;
        this.red1 = red1;
        this.red2 = red2;
        this.red3 = red3;
        this.red4 = red4;
        this.red5 = red5;
        this.blue = blue;
        return this;
    }

    public CwlGua updateByCwl(Cwl cwl) {
        this.cwl = cwl;
        setBase(cwl.getCode(), cwl.getDate(), cwl.getLastId());
        incr(cwl.getRed0(), cwl.getRed1(), cwl.getRed2(), cwl.getRed3(), cwl.getRed4(), cwl.getRed5(), cwl.getBlue());
        incrRed();
        return this;
    }

    @Override
    public void setBase(String code, String date, Long lastId) {
        super.setBase(code, date, lastId);
        cwl.setBase(code, date, lastId);
        red.setBase(code, date, lastId);
        red0.setBase(code, date, lastId);
        red1.setBase(code, date, lastId);
        red2.setBase(code, date, lastId);
        red3.setBase(code, date, lastId);
        red4.setBase(code, date, lastId);
        red5.setBase(code, date, lastId);
        blue.setBase(code, date, lastId);
    }

    public void incr(int red0, int red1, int red2, int red3, int red4, int red5, int blue) {
        this.red0.incr(red0);
        this.red1.incr(red1);
        this.red2.incr(red2);
        this.red3.incr(red3);
        this.red4.incr(red4);
        this.red5.incr(red5);
        this.blue.incr(blue);
    }

    public void incrRed() {
        red.setIs1(this.red0.getIs1() + this.red1.getIs1() + this.red2.getIs1() + this.red3.getIs1() + this.red4.getIs1() + this.red5.getIs1());
        red.setIs2(this.red0.getIs2() + this.red1.getIs2() + this.red2.getIs2() + this.red3.getIs2() + this.red4.getIs2() + this.red5.getIs2());
        red.setIs3(this.red0.getIs3() + this.red1.getIs3() + this.red2.getIs3() + this.red3.getIs3() + this.red4.getIs3() + this.red5.getIs3());
        red.setIs4(this.red0.getIs4() + this.red1.getIs4() + this.red2.getIs4() + this.red3.getIs4() + this.red4.getIs4() + this.red5.getIs4());
        red.setIs5(this.red0.getIs5() + this.red1.getIs5() + this.red2.getIs5() + this.red3.getIs5() + this.red4.getIs5() + this.red5.getIs5());
        red.setIs6(this.red0.getIs6() + this.red1.getIs6() + this.red2.getIs6() + this.red3.getIs6() + this.red4.getIs6() + this.red5.getIs6());
        red.setIs7(this.red0.getIs7() + this.red1.getIs7() + this.red2.getIs7() + this.red3.getIs7() + this.red4.getIs7() + this.red5.getIs7());
        red.setIs8(this.red0.getIs8() + this.red1.getIs8() + this.red2.getIs8() + this.red3.getIs8() + this.red4.getIs8() + this.red5.getIs8());
        red.setIs9(this.red0.getIs9() + this.red1.getIs9() + this.red2.getIs9() + this.red3.getIs9() + this.red4.getIs9() + this.red5.getIs9());
        red.setIs10(this.red0.getIs10() + this.red1.getIs10() + this.red2.getIs10() + this.red3.getIs10() + this.red4.getIs10() + this.red5.getIs10());
        red.setIs11(this.red0.getIs11() + this.red1.getIs11() + this.red2.getIs11() + this.red3.getIs11() + this.red4.getIs11() + this.red5.getIs11());
        red.setIs12(this.red0.getIs12() + this.red1.getIs12() + this.red2.getIs12() + this.red3.getIs12() + this.red4.getIs12() + this.red5.getIs12());
        red.setIs13(this.red0.getIs13() + this.red1.getIs13() + this.red2.getIs13() + this.red3.getIs13() + this.red4.getIs13() + this.red5.getIs13());
        red.setIs14(this.red0.getIs14() + this.red1.getIs14() + this.red2.getIs14() + this.red3.getIs14() + this.red4.getIs14() + this.red5.getIs14());
        red.setIs15(this.red0.getIs15() + this.red1.getIs15() + this.red2.getIs15() + this.red3.getIs15() + this.red4.getIs15() + this.red5.getIs15());
        red.setIs16(this.red0.getIs16() + this.red1.getIs16() + this.red2.getIs16() + this.red3.getIs16() + this.red4.getIs16() + this.red5.getIs16());
        red.setIs17(this.red0.getIs17() + this.red1.getIs17() + this.red2.getIs17() + this.red3.getIs17() + this.red4.getIs17() + this.red5.getIs17());
        red.setIs18(this.red0.getIs18() + this.red1.getIs18() + this.red2.getIs18() + this.red3.getIs18() + this.red4.getIs18() + this.red5.getIs18());
        red.setIs19(this.red0.getIs19() + this.red1.getIs19() + this.red2.getIs19() + this.red3.getIs19() + this.red4.getIs19() + this.red5.getIs19());
        red.setIs20(this.red0.getIs20() + this.red1.getIs20() + this.red2.getIs20() + this.red3.getIs20() + this.red4.getIs20() + this.red5.getIs20());
        red.setIs21(this.red0.getIs21() + this.red1.getIs21() + this.red2.getIs21() + this.red3.getIs21() + this.red4.getIs21() + this.red5.getIs21());
        red.setIs22(this.red0.getIs22() + this.red1.getIs22() + this.red2.getIs22() + this.red3.getIs22() + this.red4.getIs22() + this.red5.getIs22());
        red.setIs23(this.red0.getIs23() + this.red1.getIs23() + this.red2.getIs23() + this.red3.getIs23() + this.red4.getIs23() + this.red5.getIs23());
        red.setIs24(this.red0.getIs24() + this.red1.getIs24() + this.red2.getIs24() + this.red3.getIs24() + this.red4.getIs24() + this.red5.getIs24());
        red.setIs25(this.red0.getIs25() + this.red1.getIs25() + this.red2.getIs25() + this.red3.getIs25() + this.red4.getIs25() + this.red5.getIs25());
        red.setIs26(this.red0.getIs26() + this.red1.getIs26() + this.red2.getIs26() + this.red3.getIs26() + this.red4.getIs26() + this.red5.getIs26());
        red.setIs27(this.red0.getIs27() + this.red1.getIs27() + this.red2.getIs27() + this.red3.getIs27() + this.red4.getIs27() + this.red5.getIs27());
        red.setIs28(this.red0.getIs28() + this.red1.getIs28() + this.red2.getIs28() + this.red3.getIs28() + this.red4.getIs28() + this.red5.getIs28());
        red.setIs29(this.red0.getIs29() + this.red1.getIs29() + this.red2.getIs29() + this.red3.getIs29() + this.red4.getIs29() + this.red5.getIs29());
        red.setIs30(this.red0.getIs30() + this.red1.getIs30() + this.red2.getIs30() + this.red3.getIs30() + this.red4.getIs30() + this.red5.getIs30());
        red.setIs31(this.red0.getIs31() + this.red1.getIs31() + this.red2.getIs31() + this.red3.getIs31() + this.red4.getIs31() + this.red5.getIs31());
        red.setIs32(this.red0.getIs32() + this.red1.getIs32() + this.red2.getIs32() + this.red3.getIs32() + this.red4.getIs32() + this.red5.getIs32());
        red.setIs33(this.red0.getIs33() + this.red1.getIs33() + this.red2.getIs33() + this.red3.getIs33() + this.red4.getIs33() + this.red5.getIs33());
    }

    public int sum() {
        return red0.count(cwl.getRed0()) + red1.count(cwl.getRed1()) + red2.count(cwl.getRed2()) + red3.count(cwl.getRed3()) + red4.count(cwl.getRed4()) + red5.count(cwl.getRed5()) + blue.count(cwl.getBlue());
    }

    public int getPrByNum(String name, int num) {
        switch (name) {
            case "red0":
                return red0.count(num);
            case "red1":
                return red1.count(num);
            case "red2":
                return red2.count(num);
            case "red3":
                return red3.count(num);
            case "red4":
                return red4.count(num);
            case "red5":
                return red5.count(num);
            case "blue":
                return blue.count(num);
            default:
                return 0;
        }
    }
}
