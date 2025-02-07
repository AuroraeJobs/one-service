package org.aurorae.record.circle;

import lombok.*;
import org.aurorae.record.model.RecordObject;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecordCircle extends RecordObject {
    long x1;
    long y1;
    long x2;
    long y2;
    long x3;
    long y3;

    long a;
    long b;
    long pow_r;

    public RecordCircle(long x1, long y1, long x2, long y2, long x3, long y3) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x3;
        this.y3 = y3;
    }

    public RecordCircle xy1(long x1, long y1) {
        this.x1 = x1;
        this.y1 = y1;
        return this;
    }

    public RecordCircle xy2(long x2, long y2) {
        this.x2 = x2;
        this.y2 = y2;
        return this;
    }

    public RecordCircle xy3(long x3, long y3) {
        this.x3 = x3;
        this.y3 = y3;
        return this;
    }

    public RecordCircle compute() {
        // System.out.printf("(%s, %s), (%s, %s), (%s, %s)%n", x1, y1, x2, y2, x3, y3);
        if ((y3 - y2) * (x2 - x1) == (x3 - x2) * (y2 - y1)) {
            a = 0;
            b = 0;
            pow_r = 0;
            System.out.println("三点一线");
            return this;
        }
        long i = 2 * (x2 - x1);
        long j = 2 * (y2 - y1);
        long p = x2 * x2 - x1 * x1 + y2 * y2 - y1 * y1;

        long m = 2 * (x3 - x2);
        long n = 2 * (y3 - y2);
        long q = x3 * x3 - x2 * x2 + y3 * y3 - y2 * y2;

        a = (n * p - q * j) / (n * i - m * j);
        b = (m * p - q * i) / (m * j - n * i);
        pow_r = (x1 - a) * (x1 - a) + (y1 - b) * (y1 - b);
        return this;
    }
}
