package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.cwl.model.CwlGua;
import org.aurorae.cwl.service.*;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Service
@Component
public class CwlGuaServiceImpl implements CwlGuaService {

    @Resource
    private CwlRedService redService;

    @Resource
    private CwlRed0Service red0Service;

    @Resource
    private CwlRed1Service red1Service;

    @Resource
    private CwlRed2Service red2Service;

    @Resource
    private CwlRed3Service red3Service;

    @Resource
    private CwlRed4Service red4Service;

    @Resource
    private CwlRed5Service red5Service;

    @Resource
    private CwlBlueService blueService;

    @Resource
    private CwlService cwlService;

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
