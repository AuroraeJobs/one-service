package org.aurorae.core.repository;

import org.aurorae.core.model.X3;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * @author aurorae
 */
public interface GuaRepository extends MongoRepository<X3, Long> {
}
