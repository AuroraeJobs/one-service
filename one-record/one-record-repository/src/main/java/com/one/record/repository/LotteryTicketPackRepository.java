package com.one.record.repository;

import com.one.record.model.LotteryTicketPack;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface LotteryTicketPackRepository extends MongoRepository<LotteryTicketPack, String> {

    List<LotteryTicketPack> findByUserIdOrderByUpdatedAtDesc(String userId, Pageable pageable);

    List<LotteryTicketPack> findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(String userId, Pageable pageable);

    Optional<LotteryTicketPack> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);

    long countByUserIdAndArchivedFalse(String userId);
}
