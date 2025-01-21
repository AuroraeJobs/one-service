package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.*;
import org.aurorae.cwl.service.CwlGuaService;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.CwlYaoService;
import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;

@Component
@AllArgsConstructor
public class CwlGuaServiceImpl implements CwlGuaService {

    private final CwlYaoService<CwlRed> redService;
    private final CwlYaoService<CwlRed0> red0Service;
    private final CwlYaoService<CwlRed1> red1Service;
    private final CwlYaoService<CwlRed2> red2Service;
    private final CwlYaoService<CwlRed3> red3Service;
    private final CwlYaoService<CwlRed4> red4Service;
    private final CwlYaoService<CwlRed5> red5Service;
    private final CwlYaoService<CwlBlue> blueService;
    private final CwlService cwlService;

    @Override
    public CwlGua save(CwlGua item) {
        redService.save(item.getRed());
        red0Service.save(item.getRed0());
        red1Service.save(item.getRed1());
        red2Service.save(item.getRed2());
        red3Service.save(item.getRed3());
        red4Service.save(item.getRed4());
        red5Service.save(item.getRed5());
        blueService.save(item.getBlue());
        return item;
    }

    @Override
    public CwlGua findById(Long id) {
        return new CwlGua(cwlService.findById(id))
                .setGua(
                        redService.findById(id),
                        red0Service.findById(id),
                        red1Service.findById(id),
                        red2Service.findById(id),
                        red3Service.findById(id),
                        red4Service.findById(id),
                        red5Service.findById(id),
                        blueService.findById(id)
                );
    }
}
