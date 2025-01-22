package org.aurorae.cwl.repository;

import org.aurorae.cwl.ball.ColorBall;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public interface ColorBallRepository<Color extends ColorBall> extends MongoRepository<Color, String> {
}
