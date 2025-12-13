package org.aurorae.record.repository;

import org.aurorae.record.response.Record;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RecordRepository extends MongoRepository<Record, String> {

    Record findTopByOrderByCodeAsc();

    Record findTopByOrderByCodeDesc();

    List<Record> findByCodeBetween(String start, String end);

    List<Record> findByDateBetween(String start, String end);

    List<Record> findByLineBetween(long start, long end);
}
