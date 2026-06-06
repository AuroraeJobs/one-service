package com.one.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.model.ChargeStation;
import com.one.record.service.IChargeStationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("charge-station")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class ChargeStationController {
    
    private final IChargeStationService service;
    
    @PostMapping
    @Operation(summary = "添加充电站", description = "添加一个新的充电站")
    public ChargeStation save(@RequestBody ChargeStation station) {
        log.info("Saving charge station: {}", station);
        return service.save(station);
    }
    
    @PutMapping
    @Operation(summary = "更新充电站", description = "更新一个充电站信息")
    public ChargeStation update(@RequestBody ChargeStation station) {
        log.info("Updating charge station: {}", station);
        return service.update(station);
    }
    
    @DeleteMapping("{id}")
    @Operation(summary = "删除充电站", description = "根据ID删除充电站")
    public void delete(@PathVariable String id) {
        log.info("Deleting charge station with id: {}", id);
        service.delete(id);
    }
    
    @GetMapping("{id}")
    @Operation(summary = "查询充电站", description = "根据ID查询充电站")
    public ChargeStation findById(@PathVariable String id) {
        return service.findById(id);
    }
    
    @GetMapping
    @Operation(summary = "查询所有充电站", description = "查询所有充电站")
    public List<ChargeStation> findAll() {
        return service.findAll();
    }
    
    @GetMapping("provider/{provider}")
    @Operation(summary = "按充电提供方查询", description = "查询指定充电提供方的充电站")
    public List<ChargeStation> findByProvider(@PathVariable String provider) {
        return service.findByProvider(provider);
    }
    
    @GetMapping("location/{location}")
    @Operation(summary = "按地点查询", description = "查询指定地点的充电站")
    public List<ChargeStation> findByLocation(@PathVariable String location) {
        return service.findByLocation(location);
    }
    
    @GetMapping("search")
    @Operation(summary = "按提供方和地点查询", description = "按充电提供方和地点查询充电站")
    public List<ChargeStation> findByProviderAndLocation(
            @RequestParam String provider,
            @RequestParam String location) {
        return service.findByProviderAndLocation(provider, location);
    }
    
    @GetMapping("code/{stationCode}")
    @Operation(summary = "按站点编码查询", description = "根据站点编码查询充电站")
    public ChargeStation findByStationCode(@PathVariable String stationCode) {
        return service.findByStationCode(stationCode);
    }
}