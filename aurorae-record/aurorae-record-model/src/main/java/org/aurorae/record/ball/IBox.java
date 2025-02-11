package org.aurorae.record.ball;

import lombok.SneakyThrows;
import org.aurorae.record.file.RecordFile;

import java.io.BufferedReader;

public interface IBox {

    static void box(IBox box, String readFrom, String writeTo) {
        box.box(readFrom, writeTo);
    }

    @SneakyThrows
    default void box(String readFrom, String writeTo) {
        try (BufferedReader reader = RecordFile.reader(readFrom)) {
            String line;
            while ((line = reader.readLine()) != null) {
                record(line);
            }
        }
        writeTo(writeTo);
    }

    void record(String line);

    void writeTo(String filename);
}
