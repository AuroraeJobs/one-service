package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryTicketPack;
import com.one.record.service.ILotteryTicketPackService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("lottery/ticket-packs")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryTicketPackController {

    private final ILotteryTicketPackService service;

    @GetMapping
    @Operation(summary = "分页查询彩票票包", description = "查询待审批、已审批、已保存或归档的彩票票包")
    public LotteryPageResponse<LotteryTicketPack> ticketPacks(@RequestParam(name = "includeArchived", required = false) Boolean includeArchived,
                                                              @RequestParam(name = "page", required = false, defaultValue = "1") Integer page,
                                                              @RequestParam(name = "pageSize", required = false, defaultValue = "20") Integer pageSize) {
        return service.ticketPacks(includeArchived, page, pageSize);
    }

    @PostMapping("preview")
    @Operation(summary = "预览彩票票包", description = "规范化票包候选并返回预算预检，不保存草稿")
    public LotteryTicketPack preview(@RequestBody LotteryTicketPack ticketPack) {
        log.info("Previewing lottery ticket pack");
        return service.preview(ticketPack);
    }

    @PostMapping
    @Operation(summary = "创建彩票票包草稿", description = "从决策集、沙盘候选或手动候选创建待审批票包")
    public LotteryTicketPack create(@RequestBody LotteryTicketPack ticketPack) {
        log.info("Creating lottery ticket pack: {}", ticketPack);
        return service.create(ticketPack);
    }

    @PatchMapping("{id}/approve")
    @Operation(summary = "审批彩票票包", description = "将待审批票包标记为已审批并刷新预算预检")
    public LotteryTicketPack approve(@PathVariable("id") String id) {
        log.info("Approving lottery ticket pack: {}", id);
        return service.approve(id);
    }

    @PostMapping("{id}/save-tickets")
    @Operation(summary = "票包保存为票据", description = "将已审批票包批量保存为个人彩票票据")
    public LotteryTicketPack saveAsTickets(@PathVariable("id") String id) {
        log.info("Saving lottery ticket pack as tickets: {}", id);
        return service.saveAsTickets(id);
    }

    @PatchMapping("{id}/archive")
    @Operation(summary = "归档彩票票包", description = "归档不再执行的彩票票包")
    public LotteryTicketPack archive(@PathVariable("id") String id) {
        log.info("Archiving lottery ticket pack: {}", id);
        return service.archive(id);
    }
}
