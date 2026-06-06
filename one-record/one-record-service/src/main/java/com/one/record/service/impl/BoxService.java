package com.one.record.service.impl;

import lombok.AllArgsConstructor;
import com.one.record.ball.BlueBall;
import com.one.record.ball.ColorBox;
import com.one.record.ball.RedBall;
import com.one.record.repository.ColorBallRepository;
import com.one.record.response.Record;
import com.one.record.service.IBoxService;
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
