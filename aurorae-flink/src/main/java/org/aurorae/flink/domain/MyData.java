package org.aurorae.flink.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyData {

    private String name;
    private String url;
    private long timestamp;

    @Override
    public String toString() {
        return "MyData{" +
                "name='" + name + '\'' +
                ", url='" + url + '\'' +
                ", timestamp=" + new Timestamp(timestamp) +
                '}';
    }

    public static MyData[] myData() {
        return new MyData[]{new MyData("Tom", "/index", System.currentTimeMillis() - 5000),
                new MyData("Jack", "/home", System.currentTimeMillis() - 4000),
                new MyData("Rose", "/device", System.currentTimeMillis() - 3000),
                new MyData("Tim", "/alert", System.currentTimeMillis() - 2000),
                new MyData("Bob", "/model", System.currentTimeMillis() - 1000)};
    }
}
