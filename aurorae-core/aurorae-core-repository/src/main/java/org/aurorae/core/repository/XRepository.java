package org.aurorae.core.repository;

import org.aurorae.core.model.XX;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * @author aurorae
 */
public interface XRepository extends MongoRepository<XX, String> {
}
