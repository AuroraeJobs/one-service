package com.one.record.repository;

import com.one.record.model.LotteryAstronaut;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LotteryAstronautRepository extends MongoRepository<LotteryAstronaut, String> {

    List<LotteryAstronaut> findByCampOrderByNumberAsc(String camp);

    List<LotteryAstronaut> findAllByOrderByCampAscNumberAsc();

    Optional<LotteryAstronaut> findByCampAndNumber(String camp, String number);

    void deleteByCamp(String camp);

    long countByCamp(String camp);
}
