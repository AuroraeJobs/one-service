package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.Ball;
import org.aurorae.cwl.model.Box;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.IBoxService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class BoxService implements IBoxService {

    @Resource
    private CwlService cwlService;

    @Override
    public Box year(String year) {
        List<Cwl> cwlList = cwlService.findByYear(year);
        Box box = Box.one();
        for (int i = 0; i < cwlList.size(); i++) {
            Cwl cwl = cwlList.get(i);
            int is = i + 1;
            for (Integer id : cwl.getRed()) {
                box.space(id).increase(is);
            }
            box.time(cwl.getBlue()).increase(is);
            for (Ball ball : box.getSpace().values()) {
                ball.rate(is);
            }
            for (Ball ball : box.getTime().values()) {
                ball.rate(is);
            }
        }
        return box;
    }
}
