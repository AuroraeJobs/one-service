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
 * 执行命令: java -jar one-record.jar migrate-station-location
 * 执行完成后可删除此类并移除ChargeStation.location字段
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
            
            if (location == null || location.isEmpty()) {
                continue;
            }
            
            if (stationName == null || stationName.isEmpty()) {
                station.setStationName(location);
            } else if (!stationName.contains(location)) {
                station.setStationName(location + " " + stationName);
            } else {
                continue;
            }
            
            updated++;
            stationRepository.save(station);
            log.info("更新充电站: {} -> stationName: {}", station.getStationCode(), station.getStationName());
        }
        
        log.info("迁移完成！共更新 {} 个充电站", updated);
    }
}
