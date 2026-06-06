package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_astronauts")
@CompoundIndex(name = "idx_lottery_astronaut_camp_number", def = "{'camp': 1, 'number': 1}", unique = true)
public class LotteryAstronaut {

    @Id
    private String id;

    private String camp;

    private String number;

    private String name;

    private String gender;

    private String source;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
