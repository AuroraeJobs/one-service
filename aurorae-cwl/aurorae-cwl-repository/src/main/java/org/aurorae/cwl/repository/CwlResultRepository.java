package org.aurorae.cwl.repository;

import org.aurorae.cwl.response.CwlResult;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CwlResultRepository extends MongoRepository<CwlResult, String> {

    CwlResult findTopByOrderByCodeAsc();

    CwlResult findTopByOrderByCodeDesc();
}
