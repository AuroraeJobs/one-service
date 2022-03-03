package org.aurorae.core.repository;

import org.aurorae.core.model.Gua;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * @author aurorae
 */
public interface GuaRepository extends MongoRepository<Gua, Long> {
}
