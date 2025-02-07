package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document("BallBlue")
public class BlueBall extends ColorBall {

    public BlueBall init() {
        super.init(16);
        return this;
    }
}
