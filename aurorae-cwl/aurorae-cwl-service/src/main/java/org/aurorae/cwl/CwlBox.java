package org.aurorae.cwl;

import java.io.BufferedReader;

import org.aurorae.common.enums.SpaceBall;
import org.aurorae.common.enums.TimeBall;
import org.aurorae.cwl.file.CwlFile;
import org.aurorae.cwl.model.Box;

import lombok.SneakyThrows;

public class CwlBox {

    public static void main(String[] args) {
        box();
    }

    @SneakyThrows
    public static void box() {
        long start = System.currentTimeMillis();
        // 空间，对应红色球1～33，每期抽中6个
        box(Box.one(SpaceBall.values()), 0, 6).writeTo("space");
        // 时间，对应蓝色球1～16，每期抽中1个
        box(Box.one(TimeBall.values()), 12, 1).writeTo("time");
        System.out.println("> Finish! [" + (System.currentTimeMillis() - start) + "]ms");
    }

    @SneakyThrows
    public static Box box(Box box, int begin, int hits) {
        try (BufferedReader reader = CwlFile.reader()) {
            int issue = 1;
            String line;
            while ((line = reader.readLine()) != null) {
                String record = line.substring(begin);
                String[] records = CwlFile.substring(record, hits);
                box.issue(issue, issue * hits, records);
                issue++;
            }
        }
        return box;
    }
}
