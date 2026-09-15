package com.one.record.migration;

import com.one.record.model.ChargeStation;
import com.one.record.repository.ChargeStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 充电站数据迁移：将location合并到stationName
 * 执行后删除location字段
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StationLocationMigration implements CommandLineRunner {

    private final ChargeStationRepository stationRepository;

    @Override
    public void run(String... args) throws Exception {
        if (args.length > 0 && "migrate-station-location".equals(args[0])) {
            migrateStationLocation();
        }
    }

    public void migrateStationLocation() {
        log.info("开始迁移充电站location到stationName...");
        
        List<ChargeStation> stations = stationRepository.findAll();
        log.info("找到 {} 个充电站", stations.size());
        
        int updated = 0;
        
        for (ChargeStation station : stations) {
            String location = station.getLocation();
            String stationName = station.getStationName();
            
            // 如果有location且stationName不包含location，则合并
            if (location != null && !location.isEmpty()) {
                if (stationName == null || stationName.isEmpty()) {
                    // stationName为空，直接用location
                    station.setStationName(location);
                } else if (!stationName.contains(location)) {
                    // stationName不包含location，合并为 "location stationName"
                    station.setStationName(location + " " + stationName);
                }
                // 如果stationName已经包含location，不需要处理
                
                updated++;
                stationRepository.save(station);
                log.info("更新充电站: {} -> stationName: {}", station.getStationCode(), station.getStationName());
            }
        }
        
        log.info("迁移完成！共更新 {} 个充电站", updated);
    }
}
