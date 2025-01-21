package org.aurorae.cwl.repository;

import org.aurorae.cwl.model.CwlYao;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface CwlYaoRepository<T extends CwlYao> extends MongoRepository<T, Long> {
}
