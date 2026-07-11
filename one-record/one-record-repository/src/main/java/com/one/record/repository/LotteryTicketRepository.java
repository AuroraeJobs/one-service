package com.one.record.repository;

import com.one.record.model.LotteryTicket;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface LotteryTicketRepository extends MongoRepository<LotteryTicket, String> {

    List<LotteryTicket> findByUserIdOrderByPeriodDescCreatedAtDesc(String userId);

    List<LotteryTicket> findByUserIdAndIssueOrderByCreatedAtDesc(String userId, String issue);

    List<LotteryTicket> findByUserIdAndPredictionSnapshotIdOrderByCreatedAtDesc(String userId, String predictionSnapshotId);

    Optional<LotteryTicket> findByIdAndUserId(String id, String userId);

    Optional<LotteryTicket> findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(String userId,
                                                                                String issue,
                                                                                List<String> redNumbers,
                                                                                String blueNumber);

    List<LotteryTicket> findByUserIdAndIssueAndRedNumbersAndBlueNumber(String userId,
                                                                       String issue,
                                                                       List<String> redNumbers,
                                                                       String blueNumber);
}
