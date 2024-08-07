package org.aurorae.cwl.repository;

import org.aurorae.cwl.model.CwlValue;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CwlValueRepository extends MongoRepository<CwlValue, Long> {
}
