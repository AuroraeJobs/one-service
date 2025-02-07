package org.aurorae.record.repository;

import org.aurorae.record.ball.ColorBall;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface ColorBallRepository<Color extends ColorBall> extends MongoRepository<Color, String> {
}
