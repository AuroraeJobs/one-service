package org.aurorae.cwl.repository;

import org.aurorae.cwl.model.Cwl;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CwlRepository extends MongoRepository<Cwl, Long> {

    List<Cwl> findByDateStartsWith(String date);

    Cwl findTopByOrderByCodeDesc();

    Cwl findTopByOrderByCodeAsc();
}
