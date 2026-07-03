package com.one.record.web;

import com.one.record.model.LotteryTicket;
import com.one.record.service.ILotteryTicketService;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.training.LotteryActualRecord;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

    @GetMapping
    @Operation(summary = "查询彩票票据", description = "查询个人彩票票据，可按期号过滤")
    public List<LotteryTicket> tickets(@RequestParam(name = "issue", required = false) String issue) {
        return service.tickets(issue);
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

    @PutMapping("{id}")
    @Operation(summary = "更新彩票票据", description = "按票据 ID 更新个人彩票票据")
    public LotteryTicket updateTicket(@PathVariable("id") String id, @RequestBody LotteryTicket ticket) {
        log.info("Updating lottery ticket: id={}, ticket={}", id, ticket);
        return service.updateTicket(id, ticket);
    }

    @DeleteMapping("{id}")
    @Operation(summary = "删除彩票票据", description = "按票据 ID 删除个人彩票票据")
    public void deleteTicket(@PathVariable("id") String id) {
        log.info("Deleting lottery ticket: {}", id);
        service.deleteTicket(id);
    }

    @PostMapping("check-prizes")
    @Operation(summary = "检查彩票票据中奖结果", description = "按实际开奖结果检查同一期个人票据并写回中奖结果")
    public List<LotteryTicket> checkPrizes(@RequestBody LotteryActualRecord actualRecord) {
        log.info("Checking lottery ticket prizes: {}", actualRecord);
        return service.checkPrizes(actualRecord);
    }
}
