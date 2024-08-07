package org.aurorae.cwl.service;

import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.response.CwlResult;

import java.util.List;

public interface CwlService {

    String echarts(String year);

    /**
     * 查询结果
     *
     * @param year year
     * @return list
     */
    List<Cwl> findByYear(String year);

    List<Cwl> findAllAsc();

    Cwl findById(Long code);

    List<Cwl> findAllDesc();

    Cwl findDesc();

    Cwl findAsc();

    List<Cwl> saveAll(List<Cwl> list);

    Cwl save(Cwl item);

    Cwl getNewIssue();

    List<Cwl> getNewIssues(int issueCount);

    List<Cwl> getIssues(String start, String end);

    List<Cwl> getIssuesByYear(int year);

    List<Cwl> getIssuesByDay(String start, String end);

    /**
     * 获取结果
     *
     * @param issueCount issueCount
     * @return count
     */
    List<CwlResult> getByCount(int issueCount);

    List<CwlResult> getByIssue(String start, String end);

    List<CwlResult> getByDay(String start, String end);

    /**
     * 把获取的结果入库
     *
     * @param issueCount issueCount
     * @return count
     */
    int saveByCount(int issueCount);

    int saveByIssue(String start, String end);

    int saveByDay(String start, String end);
}
