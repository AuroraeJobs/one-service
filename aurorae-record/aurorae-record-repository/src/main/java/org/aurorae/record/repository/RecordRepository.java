package org.aurorae.record.repository;

import org.aurorae.record.response.Record;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RecordRepository extends MongoRepository<Record, String> {

    Record findTopByOrderByCodeAsc();

    Record findTopByOrderByCodeDesc();
}
