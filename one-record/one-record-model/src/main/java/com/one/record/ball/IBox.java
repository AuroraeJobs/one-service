package com.one.record.ball;

import lombok.SneakyThrows;
import com.one.record.file.RecordFile;

import java.io.BufferedReader;

public interface IBox {

    @SneakyThrows
    default void box() {
        try (BufferedReader reader = RecordFile.reader(getReadFrom())) {
            String line;
            while ((line = reader.readLine()) != null) {
                record(line);
            }
        }
        writeTo();
    }

    String getReadFrom();

    void record(String line);

    void writeTo();
}
