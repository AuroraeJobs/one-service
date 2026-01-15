package org.aurorae.record.ball;

import lombok.SneakyThrows;
import org.aurorae.record.file.RecordFile;

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
