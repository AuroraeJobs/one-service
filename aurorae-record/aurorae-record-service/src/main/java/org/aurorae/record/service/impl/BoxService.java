package org.aurorae.record.service.impl;

import lombok.AllArgsConstructor;
import org.aurorae.record.ball.BlueBall;
import org.aurorae.record.ball.ColorBox;
import org.aurorae.record.ball.RedBall;
import org.aurorae.record.repository.ColorBallRepository;
import org.aurorae.record.response.Record;
import org.aurorae.record.service.IBoxService;
import org.springframework.stereotype.Service;

import java.util.List;

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
                blue.findById(code).orElse(null)
        );
    }

    @Override
    public void init(List<Record> records) {
        ColorBox.one().save(records, this::save);
    }

    @Override
    public void update(String code, List<Record> records) {
        findById(code).save(records, this::save);
    }
}
