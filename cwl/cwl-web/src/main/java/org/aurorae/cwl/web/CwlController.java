package org.aurorae.cwl.web;

import com.alibaba.dubbo.config.annotation.Reference;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.CwlService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("v1")
@Slf4j
public class CwlController {

    @Reference
    private CwlService service;

    @GetMapping("/find/year/{year}")
    private List<Cwl> findByYear(@PathVariable String year) {
        return service.findByYear(year);
    }

    @GetMapping("/find/echarts/{year}")
    private String echarts(@PathVariable String year) {
        return service.echarts(year);
    }

    @GetMapping("/find/desc")
    private Cwl findDesc() {
        return service.findDesc();
    }

    @GetMapping("/find/asc")
    private Cwl findAsc() {
        return service.findAsc();
    }

    @GetMapping("/get/{issueCount}")
    private List<CwlResult> getResultByCount(@PathVariable int issueCount) {
        return service.getByCount(issueCount);
    }

    @GetMapping("/get/issue/{start}/{end}")
    private List<CwlResult> getByIssue(@PathVariable String start, @PathVariable String end) {
        return service.getByIssue(start, end);
    }

    @GetMapping("/get/day/{start}/{end}")
    private List<CwlResult> getByDay(@PathVariable String start, @PathVariable String end) {
        return service.getByDay(start, end);
    }

    @GetMapping("/save/{issueCount}")
    private int saveByCount(@PathVariable int issueCount) {
        return service.saveByCount(issueCount);
    }

    @GetMapping("/save/issue/{start}/{end}")
    private int saveByIssue(@PathVariable String start, @PathVariable String end) {
        return service.saveByIssue(start, end);
    }

    @GetMapping("/save/day/{start}/{end}")
    private int saveByDay(@PathVariable String start, @PathVariable String end) {
        return service.saveByDay(start, end);
    }

    @GetMapping("/save/year/{year}")
    private int saveByYear(@PathVariable String year) {
        return service.saveByIssue(year + "101", year + "200") + service.saveByIssue(year + "001", year + "100");
    }
}
