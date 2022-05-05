package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.common.excel.ExcelRow;
import org.aurorae.common.excel.ExcelSheet;
import org.aurorae.common.excel.ExcelWorkBook;
import org.aurorae.common.model.BaseObject;
import org.aurorae.common.util.MapUtil;
import org.aurorae.cwl.circle.CwlCircle;
import org.aurorae.cwl.enums.CwlRange;
import org.aurorae.cwl.excel.CwlExcelWorkBook;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.model.CwlGua;
import org.aurorae.cwl.model.CwlRed;
import org.aurorae.cwl.model.CwlYao;
import org.aurorae.cwl.service.*;
import org.aurorae.cwl.excel.CwlExcelWriter;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Component
public class CwlProServiceImpl implements CwlProService {

    @Resource
    private CwlService cwlService;

    @Resource
    private CwlGuaService guaService;

    @Resource
    private CwlRedService redService;

    @Resource
    private CwlRed0Service red0Service;

    @Override
    public void red0() {
        Map<Integer, Integer> map = red0Service.findById(2022024L).getMap();
        AtomicInteger yin = new AtomicInteger();
        AtomicInteger yang = new AtomicInteger();
        map.forEach((integer, integer2) -> {
            if (integer % 2 == 0) {
                yang.addAndGet(integer2);
            } else {
                yin.addAndGet(integer2);
            }
        });
        System.out.println(yin.get() + ":" + yang.get());
    }

    @Override
    public void limit() {
        List<Cwl> list = cwlService
                .findAllDesc()
                .stream()
                .skip(0)
                .limit(19)
                .collect(Collectors.toList());
        Set<Integer> set = new HashSet<>();
        for (Cwl cwl : list) {
            set.addAll(cwl.getRed());
        }
        System.out.println(set);
    }

    @Override
    public void lucky() {
        List<Cwl> list = cwlService
                .findAllDesc()
                .stream()
                .skip(0)
                .limit(100)
                .collect(Collectors.toList());
        Map<Long, Cwl> map = list.stream().collect(Collectors.toMap(BaseObject::getId, Function.identity()));
        Set<Integer> set = new HashSet<>();
        int issue = 1;
        ExcelWorkBook workBook = new ExcelWorkBook();
        ExcelSheet sheet = workBook.createSheet();
        AtomicInteger column = new AtomicInteger();
        for (Cwl cwl : list) {
            set.clear();
            ExcelRow row = sheet.createRow(column.getAndIncrement());
            row.createCell(0, cwl.getId());
            row.createCell(1, set(cwl, issue, set, map));
        }
        CwlExcelWriter.write(workBook);
    }

    private int set(Cwl root, int issue, Set<Integer> set, Map<Long, Cwl> map) {
        set.addAll(root.getRed());
        if (set.size() < 33) {
            Cwl last = map.get(root.getLastId());
            if (last != null) {
                return set(last, issue + 1, set, map);
            }
        }
        return issue;
    }

    @Override
    public void excel() {
        CwlExcelWorkBook workBook = new CwlExcelWorkBook();
        ExcelSheet sheet = workBook.createSheet();

        List<Map<Integer, Integer>> collect = redService
                .findAll()
                .stream()
                .sorted(Comparator.comparing(BaseObject::getId).reversed())
                .skip(0)
                .limit(10)
                .map(CwlYao::getMap)
                .collect(Collectors.toList());
        // 基本
        for (int i = 0; i < collect.size(); i++) {
            ExcelRow row = sheet.createRow(i);
            collect.get(i).forEach((k, v) -> row.createCell(k - 1, v));
        }
        // 余数
        AtomicInteger columnStart = new AtomicInteger(collect.get(0).size());
        Map<Integer, List<Map<Integer, Integer>>> covert = covert(collect);
        covert.forEach((integer, maps) -> {
            int col = columnStart.incrementAndGet();
            for (int i = 0; i < maps.size(); i++) {
                ExcelRow row = sheet.getRow(i);
                maps.get(i).forEach((k, v) -> row.createCell(col + k, v));
            }
            columnStart.addAndGet(integer);
        });
        // 预测
        int col = columnStart.get();
        for (int i = 0; i < collect.size(); i++) {
            ExcelRow row = sheet.getRow(i);
            for (Map.Entry<Integer, Integer> d : collect.get(i).entrySet()) {
                for (Map.Entry<Integer, List<Map<Integer, Integer>>> e : covert.entrySet()) {
                    d.setValue(d.getValue() + e.getValue().get(i).get(d.getKey() % e.getKey()));
                }
                row.createCell(col + d.getKey(), d.getValue());
            }
        }

        // CwlExcelWriter.write(workBook);
        CwlExcelWriter.write(collect.stream().map(MapUtil::mapList).flatMap(Collection::stream).collect(Collectors.toList()));
    }

    private Map<Integer, List<Map<Integer, Integer>>> covert(List<Map<Integer, Integer>> maps) {
        Map<Integer, List<Map<Integer, Integer>>> map = new HashMap<>();
        for (int i = 1; i <= maps.get(0).size(); i++) {
            int finalI = i;
            map.put(i, maps
                    .stream()
                    .map(m -> m.entrySet().stream().collect(Collectors.groupingBy(entry -> entry.getKey() % finalI, Collectors.summingInt(Map.Entry::getValue))))
                    .collect(Collectors.toList()));
        }
        return map;
    }

    @Override
    public void max() {
        List<Cwl> all = cwlService.findAllDesc();
        all.remove(0);

        // 最近连续没有出现的期数
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < all.size(); i++) {
            if (map.size() < 34) {
                Cwl cwl = all.get(i);
                int i1 = i + 1;
                map.putIfAbsent(cwl.getRed0(), i1);
                map.putIfAbsent(cwl.getRed1(), i1);
                map.putIfAbsent(cwl.getRed2(), i1);
                map.putIfAbsent(cwl.getRed3(), i1);
                map.putIfAbsent(cwl.getRed4(), i1);
                map.putIfAbsent(cwl.getRed5(), i1);
            }
        }
        System.out.println(MapUtil.sortByValueReverse(map));

        // 乘以出现的次数（即：概率）
        Map<Integer, Integer> redMap = redService.findById(all.get(0).getId()).getMap();
        System.out.println(MapUtil.sortByValueReverse(map.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, entry -> (entry.getValue() * redMap.get(entry.getKey()))))));
    }

    @Override
    public void health() {
        int year = 0, max = 1, min = 1;
        Map<Integer, Integer> firstMap = new HashMap<>();
        List<CwlRed> reds = redService.findAll();
        for (int i = 0; i < reds.size(); i++) {
            CwlRed red = reds.get(i);
            if (red.getYear() != year) {
                year = red.getYear();
                System.out.println("-------" + year + "--------");
            }
            /*int health = red.health();
            if (health > max) {
                max = health;
                System.out.println(red.getId() + ": " + max);
            }*/
            if (red.max(max)) {
                firstMap.put(max++, i);
            }
            if (red.min(min)) {
                Integer first = firstMap.get(min);
                System.out.println(red.getId() + ": " + min++ + ", (" + first + ", " + i + "), " + (i - first));
            }
        }
    }

    @Override
    public String pro(Long id) {
        CwlGua gua = guaService.findById(id);
        int max = 0;
        StringBuilder result = new StringBuilder();
        for (CwlRange v : CwlRange.values()) {
            int random = v.random();
            while (random <= max) {
                random = v.random();
            }
            max = random;
            result.append("\n").append(v.getName()).append(": ").append(random).append(": ").append(gua.getPrByNum(v.getName(), random));
        }
        return result.toString();
    }

    @Override
    public void circle() {
        CwlCircle circle = new CwlCircle();
        Iterator<Cwl> iterator = cwlService.findAllDesc().stream().skip(0).limit(500).iterator();
        int i = 1;
        while (iterator.hasNext()) {
            Cwl cwl = iterator.next();
            if (i % 3 == 1) {
                circle.xy1(cwl.week(), cwl.getRed0());
            } else if (i % 3 == 2) {
                circle.xy2(cwl.week(), cwl.getRed0());
            } else if (i % 3 == 0) {
                circle.xy3(cwl.week(), cwl.getRed0());
            }
            if (i > 2) {
                circle.compute();
                System.out.printf("【%s】圆心：(%s, %s)，半径：%s%n", cwl.getCode(), circle.getA(), circle.getB(), circle.getPow_r());
            }
            i++;
        }
    }
}
