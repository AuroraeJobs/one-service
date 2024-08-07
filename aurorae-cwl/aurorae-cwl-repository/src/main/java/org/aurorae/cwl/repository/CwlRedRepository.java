package org.aurorae.cwl.repository;

import org.aurorae.cwl.model.CwlRed;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CwlRedRepository extends MongoRepository<CwlRed, Long> {
}
