package org.aurorae.common.util;

import java.security.SecureRandom;

/**
 * @author aurorae
 */
public class IdGenerator {

    private long baseId;

    public static IdGenerator createGenerator() {
        return new IdGenerator();
    }

    private IdGenerator() {
        long t = System.currentTimeMillis();
        //52~43
        baseId = t;
        baseId &= 0x1FF0000000L;
        baseId <<= 14;
        //28~15
        t &= 0xFFFC000L;
        baseId |= t;
        //42~29
        SecureRandom ng = new SecureRandom();
        t = ng.nextLong();
        t &= 0x3FFF0000000L;
        //14~1
        baseId |= t;
        baseId /= 10000;
        baseId *= 10000;
        baseId &= 0x1FFFFFFFFFFFFL;
    }

    synchronized public long generate() {
        return baseId++;
    }

    private static IdGenerator generator;

    public static long nextId(String type) {
        if (generator == null) {
            generator = createGenerator();
        }

        return generator.generate();
    }
}
