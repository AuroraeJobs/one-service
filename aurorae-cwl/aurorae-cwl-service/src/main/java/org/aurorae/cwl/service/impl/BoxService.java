package org.aurorae.cwl.service.impl;

import lombok.AllArgsConstructor;
import org.aurorae.cwl.ball.BlueBall;
import org.aurorae.cwl.ball.ColorBox;
import org.aurorae.cwl.ball.RedBall;
import org.aurorae.cwl.repository.ColorBallRepository;
import org.aurorae.cwl.service.IBoxService;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class BoxService implements IBoxService {

    private final ColorBallRepository<RedBall> red;

    private final ColorBallRepository<BlueBall> blue;

    @Override
    public void save(ColorBox box) {
        red.save(box.getRed());
        blue.save(box.getBlue());
    }

    @Override
    public ColorBox findById(String code) {
        return new ColorBox(
                red.findById(code).orElse(null),
                blue.findById(code).orElse(null),
                code
        );
    }
}
