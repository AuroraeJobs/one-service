package com.one.record.repository;

import com.one.record.response.Record;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RecordRepository extends MongoRepository<Record, String> {

    Record findTopByOrderByCodeAsc();

    Record findTopByOrderByCodeDesc();

    List<Record> findByCodeBetween(String start, String end);

    List<Record> findByCodeBetweenOrderByCodeDesc(String start, String end, Pageable pageable);

    List<Record> findByDateBetween(String start, String end);

    List<Record> findByDateBetweenOrderByDateDesc(String start, String end, Pageable pageable);

    List<Record> findByLineBetween(long start, long end);

    List<Record> findByLineBetweenOrderByLineDesc(long start, long end, Pageable pageable);

    List<Record> findAllByOrderByCodeDesc(Pageable pageable);
}
