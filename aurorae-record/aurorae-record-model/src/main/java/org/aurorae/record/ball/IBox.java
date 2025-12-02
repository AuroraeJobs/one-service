package org.aurorae.record.ball;

import lombok.SneakyThrows;
import org.aurorae.record.file.RecordFile;

import java.io.BufferedReader;

public interface IBox {

    static void box(IBox box, String writeTo) {
        box.box(writeTo);
    }

    @SneakyThrows
    default void box(String writeTo) {
        try (BufferedReader reader = RecordFile.reader(getReadFrom())) {
            String line;
            while ((line = reader.readLine()) != null) {
                record(line);
            }
        }
        writeTo(writeTo);
    }

    String getReadFrom();

    void record(String line);

    void writeTo(String filename);
}
