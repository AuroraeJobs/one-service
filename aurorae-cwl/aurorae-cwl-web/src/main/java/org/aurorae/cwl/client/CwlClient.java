package org.aurorae.cwl.client;

import org.aurorae.cwl.hystrix.CwlHystrix;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.response.CwlResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(path = "cwl", name = "cwl", fallbackFactory = CwlHystrix.class)
public interface CwlClient {

    @GetMapping("/find/year/{year}")
    List<Cwl> findByYear(@PathVariable String year);

    @GetMapping("/find/echarts/{year}")
    String echarts(@PathVariable String year);

    @GetMapping("/find/desc")
    CwlResult findDesc();

    @GetMapping("/find/asc")
    CwlResult findAsc();

    @GetMapping("/find/{id}")
    CwlResult findById(@PathVariable String id);

    @GetMapping("/get/{issueCount}")
    List<CwlResult> getByCount(@PathVariable long issueCount);

    @GetMapping("/get/{start}/{end}")
    List<CwlResult> getByIssue(@PathVariable String start, @PathVariable String end);
}
