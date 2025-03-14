package org.aurorae.tsdb.hbase.util;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.function.Function;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

public final class CompressionMeans {

    /**
     * Compression level
     */
    public static enum Level {

        /**
         * Compression level for no compression.
         */
        NO_COMPRESSION(0),

        /**
         * Compression level for fastest compression.
         */
        BEST_SPEED(1),

        /**
         * Compression level for best compression.
         */
        BEST_COMPRESSION(9),

        /**
         * Default compression level.
         */
        DEFAULT_COMPRESSION(-1);

        private final int level;

        Level(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }
    }

    private static final int BUFFER_SIZE = 4 * 1024;

    public static byte[] compress(byte[] data, Level level) throws IOException {
        Deflater deflater = new Deflater();
        deflater.setLevel(level.getLevel());
        deflater.setInput(data);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
        deflater.finish();
        byte[] buffer = new byte[BUFFER_SIZE];
        while (!deflater.finished()) {
            int count = deflater.deflate(buffer);
            outputStream.write(buffer, 0, count);
        }
        byte[] output = outputStream.toByteArray();
        outputStream.close();
        return output;
    }

    public static byte[] decompress(byte[] data) throws IOException, DataFormatException {
        Inflater inflater = new Inflater();
        inflater.setInput(data);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
        byte[] buffer = new byte[BUFFER_SIZE];
        while (!inflater.finished()) {
            int count = inflater.inflate(buffer);
            outputStream.write(buffer, 0, count);
        }
        byte[] output = outputStream.toByteArray();
        outputStream.close();
        return output;
    }

    public static byte[] double2Bytes(double d) {
        long value = Double.doubleToRawLongBits(d);
        byte[] byteRet = new byte[8];
        for (int i = 0; i < 8; i++) {
            byteRet[i] = (byte) ((value >> 8 * i) & 0xff);
        }
        return byteRet;
    }

    public static double bytes2Double(byte[] arr) {
        long value = 0;
        for (int i = 0; i < 8; i++) {
            value |= ((long) (arr[i] & 0xff)) << (8 * i);
        }
        return Double.longBitsToDouble(value);
    }

    public static byte[] float2Bytes(float f) {
        int value = Float.floatToRawIntBits(f);
        byte[] byteRet = new byte[4];
        for (int i = 0; i < 4; i++) {
            byteRet[i] = (byte) ((value >> 8 * i) & 0xff);
        }
        return byteRet;
    }

    public static float bytes2Float(byte[] arr) {
        int value = 0;
        for (int i = 0; i < 4; i++) {
            value |= ((int) (arr[i] & 0xff)) << (8 * i);
        }
        return Float.intBitsToFloat(value);
    }

    public static byte[] concat(byte[] a, byte[] b) {
        byte[] c = new byte[a.length + b.length];
        System.arraycopy(a, 0, c, 0, a.length);
        System.arraycopy(b, 0, c, a.length, b.length);
        return c;
    }

    public static void main(String[] args) throws Exception {
        String fileRaw = "/Users/aurorae/Downloads/raw.txt";
        String fileCompress = "/Users/aurorae/Downloads/compress.txt";
        String fileDecompress = "/Users/aurorae/Downloads/decompress.txt";
        compress(fileRaw, fileCompress, data -> {
            try {
                return CompressionMeans.compress(data, Level.BEST_COMPRESSION);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        Thread.sleep(1000);
        compress(fileCompress, fileDecompress, data -> {
            try {
                return CompressionMeans.decompress(data);
            } catch (IOException | DataFormatException e) {
                throw new RuntimeException(e);
            }
        });
    }

    public static void compress(String fileInput, String fileOutput, Function<byte[], byte[]> function) throws Exception {
        BufferedInputStream in = new BufferedInputStream(Files.newInputStream(Paths.get(fileInput)));
        ByteArrayOutputStream out = new ByteArrayOutputStream(1024);
        byte[] temp = new byte[1024];
        int size;
        while ((size = in.read(temp)) != -1) {
            out.write(temp, 0, size);
        }
        in.close();
        byte[] data = out.toByteArray();
        byte[] output = function.apply(data);
        System.out.println("before : " + (data.length / 1024) + "k");
        System.out.println("after : " + (output.length / 1024) + "k");
        FileOutputStream fos = new FileOutputStream(fileOutput);
        fos.write(output);
        out.close();
        fos.close();
    }
}