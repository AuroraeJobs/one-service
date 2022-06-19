package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.Cwl64;
import org.aurorae.cwl.repository.Cwl64Repository;
import org.aurorae.cwl.service.Cwl64Service;
import org.aurorae.cwl.service.CwlService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class Cwl64ServiceImpl implements Cwl64Service {

    @Resource
    private Cwl64Repository repository;

    @Resource
    private CwlService cwlService;

    /*@Reference
    private Gua64Service gua64Service;*/

    @Override
    public String code64() {
        /*List<Gua64> gua64List = gua64Service.findAll();
        repository.saveAll(cwlService.findAllDesc().stream().map(cwl -> {
            Cwl64 cwl64 = new Cwl64(cwl);
            gua64List.stream().filter(gua64 -> gua64.getCode().equals(cwl64.getCode64())).findAny().ifPresent(gua64 -> {
                cwl64.setId64(gua64.getId());
                cwl64.setLabel64(gua64.getLabel());
            });
            return cwl64;
        }).collect(Collectors.toList()));*/
        return "";
    }

    @Override
    public void label64() {
        repository
                .findAll()
                .stream()
                .collect(Collectors.groupingBy(Cwl64::getLabel64, Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.comparingByValue())
                .forEach(System.out::println);
    }
}
