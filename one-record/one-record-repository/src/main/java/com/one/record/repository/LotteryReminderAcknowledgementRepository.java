package com.one.record.repository;

import com.one.record.model.LotteryReminderAcknowledgement;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LotteryReminderAcknowledgementRepository extends MongoRepository<LotteryReminderAcknowledgement, String> {

    Optional<LotteryReminderAcknowledgement> findByReminderKeyAndFingerprint(String reminderKey, String fingerprint);
}
