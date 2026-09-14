package com.one.record.migration;

import com.one.record.enums.ChargeProvider;
import com.one.record.model.ChargeRecord;
import com.one.record.model.ChargeStation;
import com.one.record.repository.ChargeRecordRepository;
import com.one.record.repository.ChargeStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 充电站编码迁移脚本
 * 为每个充电站的stationCode添加提供商前缀
 * 格式：3字母前缀 + 3位数字（如 TSL001）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StationCodeMigration implements CommandLineRunner {

    private final ChargeStationRepository stationRepository;
    private final ChargeRecordRepository recordRepository;

    @Override
    public void run(String... args) throws Exception {
        // 检查是否需要执行迁移
        if (args.length > 0 && "migrate-station-codes".equals(args[0])) {
            migrateStationCodes();
        }
    }

    public void migrateStationCodes() {
        log.info("开始迁移充电站编码...");
        
        // 1. 获取所有充电站
        List<ChargeStation> stations = stationRepository.findAll();
        log.info("找到 {} 个充电站", stations.size());
        
        // 2. 按提供商分组，生成新的编码
        Map<String, Integer> providerCounters = new HashMap<>();
        Map<String, String> codeMapping = new HashMap<>(); // 旧编码 -> 新编码
        
        int updatedStations = 0;
        int updatedRecords = 0;
        
        // 先为每个提供商初始化计数器
        for (ChargeProvider provider : ChargeProvider.values()) {
            providerCounters.put(provider.name(), 1);
        }
        
        for (ChargeStation station : stations) {
            String oldCode = station.getStationCode();
            String provider = station.getProvider();
            
            if (oldCode == null || provider == null) {
                log.warn("充电站数据不完整，跳过: id={}, stationCode={}, provider={}", 
                        station.getId(), oldCode, provider);
                continue;
            }
            
            // 获取提供商前缀
            ChargeProvider chargeProvider;
            try {
                chargeProvider = ChargeProvider.valueOf(provider);
            } catch (IllegalArgumentException e) {
                log.warn("未知的提供商: {}，跳过充电站: {}", provider, oldCode);
                continue;
            }
            
            String prefix = chargeProvider.getCode();
            
            // 检查是否已经符合新格式（3字母+3数字）
            if (oldCode.matches("^" + prefix + "\\d{3}$")) {
                log.info("充电站编码已符合新格式，跳过: {}", oldCode);
                // 但仍然需要更新计数器
                String numStr = oldCode.substring(prefix.length());
                try {
                    int num = Integer.parseInt(numStr);
                    Integer currentMax = providerCounters.get(provider);
                    if (currentMax != null && num >= currentMax) {
                        providerCounters.put(provider, num + 1);
                    }
                } catch (NumberFormatException e) {
                    // 忽略
                }
                continue;
            }
            
            // 生成新编码：前缀 + 3位数字
            int counter = providerCounters.get(provider);
            String newCode = prefix + String.format("%03d", counter);
            providerCounters.put(provider, counter + 1);
            
            // 记录映射关系
            codeMapping.put(oldCode, newCode);
            
            // 更新充电站
            station.setStationCode(newCode);
            stationRepository.save(station);
            updatedStations++;
            
            log.info("更新充电站编码: {} -> {}", oldCode, newCode);
        }
        
        log.info("充电站编码更新完成，共更新 {} 个", updatedStations);
        
        // 3. 更新充电记录中的location字段
        if (!codeMapping.isEmpty()) {
            List<ChargeRecord> records = recordRepository.findAll();
            log.info("找到 {} 条充电记录", records.size());
            
            for (ChargeRecord record : records) {
                String oldLocation = record.getLocation();
                
                if (oldLocation == null) {
                    continue;
                }
                
                String newLocation = codeMapping.get(oldLocation);
                if (newLocation != null) {
                    record.setLocation(newLocation);
                    recordRepository.save(record);
                    updatedRecords++;
                    log.info("更新充电记录location: {} -> {}", oldLocation, newLocation);
                }
            }
            
            log.info("充电记录更新完成，共更新 {} 条", updatedRecords);
        }
        
        log.info("迁移完成！充电站: {} 个，充电记录: {} 条", updatedStations, updatedRecords);
        
        // 4. 打印迁移结果摘要
        log.info("\n=== 迁移结果摘要 ===");
        log.info("旧编码 -> 新编码 映射:");
        codeMapping.forEach((oldCode, newCode) -> 
            log.info("  {} -> {}", oldCode, newCode));
    }
}
