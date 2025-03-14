package org.aurorae.tsdb.hbase.dao;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.tsdb.hbase.config.HBaseProperties;
import org.aurorae.tsdb.hbase.config.HBaseTableProperties;
import org.aurorae.tsdb.hbase.service.HBaseAdminService;
import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
public final class HBaseRepository {

    private final Map<String, HBaseCall> tsdbCallMap = new ConcurrentHashMap<>();

    private final HBaseAdminService adminService;

    public HBaseRepository(HBaseProperties config) {
        try {
            this.adminService = new HBaseAdminService();
            this.initTable(config.getTables());
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw e;
        }
    }

    private HBaseCall createCall(HBaseTable table) {
        return new HBaseCall(table);
    }

    public void initTable(List<HBaseTableProperties> tables) {
        if (!CollectionUtils.isEmpty(tables)) {
            tables.stream()
                    .filter(t -> t.getName() != null && !t.getName().isEmpty() && !CollectionUtils.isEmpty(t.getColumns()))
                    .forEach(this::initCall);
        }
    }

    public void initCall(HBaseTableProperties properties) {
        try {
            HBaseTable table = HBaseTable.create(properties);
            HBaseCall call = createCall(table);
            this.tsdbCallMap.put(properties.getName(), call);
            this.adminService.putTable(table);
            log.debug("> HBaseTable [{}] init finish.", properties.getName());
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    public HBaseCall getCall(String name) {
        return this.tsdbCallMap.get(name);
    }

    public void clearCache() {
        this.tsdbCallMap.values().forEach(HBaseCall::clearCache);
    }

    public void reload() {
        this.tsdbCallMap.clear();
        Map<String, HBaseCall> callMap = this.adminService
                .getTables()
                .stream()
                .collect(Collectors.toMap(HBaseTable::getTableName, this::createCall));
        this.tsdbCallMap.putAll(callMap);
    }
}
