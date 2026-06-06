package com.one.record.service;

import com.one.record.model.LotteryAstronaut;
import com.one.record.response.LotteryAstronautVoyage;
import com.one.record.response.LotteryAstronautVoyageStat;

import java.util.List;

public interface ILotteryAstronautService {

    List<LotteryAstronaut> findAll();

    List<LotteryAstronaut> findByCamp(String camp);

    LotteryAstronaut save(LotteryAstronaut astronaut);

    List<LotteryAstronaut> saveAll(List<LotteryAstronaut> astronauts);

    List<LotteryAstronaut> resetDefaults();

    LotteryAstronautVoyage voyage(String camp, String number);

    List<LotteryAstronautVoyageStat> calculateVoyageStats();

    List<LotteryAstronautVoyageStat> getVoyageStats();
}
