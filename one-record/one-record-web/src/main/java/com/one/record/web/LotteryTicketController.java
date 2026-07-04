package com.one.record.web;

import com.one.record.model.LotteryTicket;
import com.one.record.service.ILotteryTicketService;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryTicketBudgetPrecheckRequest;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.lottery.LotteryTicketBatchSaveRequest;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketBulkOperationResult;
import com.one.record.lottery.LotteryTicketBulkPatchRequest;
import com.one.record.lottery.LotteryTicketImportPreviewRequest;
import com.one.record.lottery.LotteryTicketImportPreviewResult;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.training.LotteryActualRecord;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("lottery/tickets")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryTicketController {

    private final ILotteryTicketService service;

    @GetMapping(params = "!page")
    @Operation(summary = "查询彩票票据", description = "查询个人彩票票据，可按期号、状态、来源或奖级过滤")
    public List<LotteryTicket> tickets(@RequestParam(name = "issue", required = false) String issue,
                                       @RequestParam(name = "status", required = false) String status,
                                       @RequestParam(name = "source", required = false) String source,
                                       @RequestParam(name = "prizeGrade", required = false) String prizeGrade,
                                       @RequestParam(name = "predictionSnapshotId", required = false) String predictionSnapshotId) {
        return service.tickets(issue, status, source, prizeGrade, predictionSnapshotId);
    }

    @GetMapping(params = "page")
    @Operation(summary = "分页查询彩票票据", description = "查询个人彩票票据，可按分页、期号、状态、来源、奖级、预测快照和创建时间过滤")
    public LotteryPageResponse<LotteryTicket> ticketsPage(@RequestParam(name = "issue", required = false) String issue,
                                                          @RequestParam(name = "status", required = false) String status,
                                                          @RequestParam(name = "source", required = false) String source,
                                                          @RequestParam(name = "prizeGrade", required = false) String prizeGrade,
                                                          @RequestParam(name = "predictionSnapshotId", required = false) String predictionSnapshotId,
                                                          @RequestParam(name = "createdStartAt", required = false) Long createdStartAt,
                                                          @RequestParam(name = "createdEndAt", required = false) Long createdEndAt,
                                                          @RequestParam(name = "page", required = false, defaultValue = "0") Integer page,
                                                          @RequestParam(name = "pageSize", required = false, defaultValue = "20") Integer pageSize) {
        return service.ticketsPage(issue, status, source, prizeGrade, predictionSnapshotId, createdStartAt, createdEndAt, page, pageSize);
    }

    @GetMapping("summary")
    @Operation(summary = "查询彩票票据汇总", description = "汇总个人彩票票据成本、兑奖状态和中奖分布")
    public LotteryTicketSummary summary() {
        return service.summary();
    }

    @PostMapping
    @Operation(summary = "新增彩票票据", description = "新增一条个人彩票票据")
    public LotteryTicket saveTicket(@RequestBody LotteryTicket ticket) {
        log.info("Saving lottery ticket: {}", ticket);
        return service.saveTicket(ticket);
    }

    @PostMapping("import/preview")
    @Operation(summary = "预览彩票票据导入", description = "解析粘贴内容并返回规范化行、无效原因、重复分组和预算预检")
    public LotteryTicketImportPreviewResult importPreview(@RequestBody LotteryTicketImportPreviewRequest request) {
        log.info("Previewing lottery ticket import");
        return service.importPreview(request);
    }

    @PostMapping("budget/precheck")
    @Operation(summary = "彩票票据预算预检", description = "在保存票据前返回本周、本月和单期暴露预警")
    public LotteryTicketBudgetPrecheckResult budgetPrecheck(@RequestBody LotteryTicketBudgetPrecheckRequest request) {
        log.info("Prechecking lottery ticket budget");
        return service.budgetPrecheck(request);
    }

    @PostMapping("batch")
    @Operation(summary = "批量新增彩票票据", description = "批量保存预测候选或手动票据，同一期同号码会跳过重复保存")
    public LotteryTicketBatchSaveResult saveTickets(@RequestBody LotteryTicketBatchSaveRequest request) {
        log.info("Saving lottery tickets batch: {}", request);
        return service.saveTickets(request);
    }

    @PutMapping("{id}")
    @Operation(summary = "更新彩票票据", description = "按票据 ID 更新个人彩票票据")
    public LotteryTicket updateTicket(@PathVariable("id") String id, @RequestBody LotteryTicket ticket) {
        log.info("Updating lottery ticket: id={}, ticket={}", id, ticket);
        return service.updateTicket(id, ticket);
    }

    @PatchMapping("bulk")
    @Operation(summary = "批量更新彩票票据", description = "按 ID 批量更新期号、注数、成本、状态、来源或备注")
    public LotteryTicketBulkOperationResult bulkUpdateTickets(@RequestBody LotteryTicketBulkPatchRequest request) {
        log.info("Bulk updating lottery tickets: {}", request);
        return service.bulkUpdateTickets(request);
    }

    @PatchMapping("bulk/archive")
    @Operation(summary = "批量归档彩票票据", description = "按 ID 批量将个人彩票票据标记为作废")
    public LotteryTicketBulkOperationResult archiveTickets(@RequestBody LotteryTicketBulkPatchRequest request) {
        log.info("Archiving lottery tickets: {}", request);
        return service.archiveTickets(request);
    }

    @DeleteMapping("{id}")
    @Operation(summary = "删除彩票票据", description = "按票据 ID 删除个人彩票票据")
    public void deleteTicket(@PathVariable("id") String id) {
        log.info("Deleting lottery ticket: {}", id);
        service.deleteTicket(id);
    }

    @PostMapping("bulk/delete")
    @Operation(summary = "批量删除彩票票据", description = "按 ID 批量删除个人彩票票据并记录审计")
    public LotteryTicketBulkOperationResult deleteTickets(@RequestBody LotteryTicketBulkPatchRequest request) {
        log.info("Bulk deleting lottery tickets: {}", request);
        return service.deleteTickets(request);
    }

    @PostMapping("check-prizes")
    @Operation(summary = "检查彩票票据中奖结果", description = "按实际开奖结果检查同一期个人票据并写回中奖结果")
    public List<LotteryTicket> checkPrizes(@RequestBody LotteryActualRecord actualRecord) {
        log.info("Checking lottery ticket prizes: {}", actualRecord);
        return service.checkPrizes(actualRecord);
    }

    @PostMapping("check-prizes/latest")
    @Operation(summary = "按最新开奖记录核奖", description = "使用最新开奖记录核验同一期待开奖票据，并返回核奖摘要")
    public LotteryTicketPrizeCheckSummary checkLatestPrizes() {
        log.info("Checking latest lottery ticket prizes");
        return service.checkLatestPrizes();
    }
}
