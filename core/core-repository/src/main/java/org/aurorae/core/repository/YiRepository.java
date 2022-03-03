package org.aurorae.core.repository;

import org.aurorae.core.model.Yi;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * @author aurorae
 */
public interface YiRepository extends MongoRepository<Yi, Long> {
}
