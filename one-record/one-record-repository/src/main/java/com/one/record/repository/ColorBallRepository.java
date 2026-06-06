package com.one.record.repository;

import com.one.record.ball.ColorBall;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;

@NoRepositoryBean
public interface ColorBallRepository<Color extends ColorBall> extends MongoRepository<Color, String> {

    List<Color> findByRecordContaining(String number);
}
