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
        
        // 2. 创建旧编码到新编码的映射
        Map<String, String> codeMapping = new HashMap<>();
        
        int updatedStations = 0;
        int updatedRecords = 0;
        
        for (ChargeStation station : stations) {
            String oldCode = station.getStationCode();
            String provider = station.getProvider();
            
            if (oldCode == null || provider == null) {
                log.warn("充电站数据不完整，跳过: id={}, stationCode={}, provider={}", 
                        station.getId(), oldCode, provider);
                continue;
            }
            
            // 获取提供商前缀
            ChargeProvider chargeProvider = ChargeProvider.valueOf(provider);
            String prefix = chargeProvider.getCode();
            
            // 检查是否已经包含前缀
            if (oldCode.startsWith(prefix)) {
                log.info("充电站编码已包含前缀，跳过: {}", oldCode);
                continue;
            }
            
            // 生成新编码: 前缀+原始编码（无横杠）
            String newCode = prefix + oldCode;
            
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
    }
}
