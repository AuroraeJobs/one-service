package org.aurorae.common.util;

import java.io.File;
import java.io.IOException;

public class FileUtil {

    public static File newFile(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.getParentFile().exists()) {
            boolean mkdirs = file.getParentFile().mkdirs();
            if (!mkdirs) {
                System.out.println("[ " + file.getParentFile().getAbsolutePath() + " ]创建目录失败");
            }
        }
        if (!file.exists()) {
            boolean newFile = file.createNewFile();
            if (!newFile) {
                System.out.println("[ " + filePath + " ]创建文件失败");
            }
        }
        return file;
    }
}
