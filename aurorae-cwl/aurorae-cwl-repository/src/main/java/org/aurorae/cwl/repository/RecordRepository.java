package org.aurorae.cwl.repository;

import org.aurorae.cwl.response.Record;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RecordRepository extends MongoRepository<Record, String> {

    Record findTopByOrderByCodeAsc();

    Record findTopByOrderByCodeDesc();
}
