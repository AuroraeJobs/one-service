package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.client.CwlFile;
import org.aurorae.cwl.model.Ball;
import org.aurorae.cwl.model.Box;
import org.aurorae.cwl.service.IBoxService;
import org.springframework.stereotype.Service;

@Service
public class BoxService implements IBoxService {

    @Override
    public Box box() {
        return box(CwlFile.read(), 14, 6, 2);
    }

    public static Box box(String file, int issueLength, int spaceLength, int length) {
        Box box = Box.one();
        int issue = file.length() / issueLength;
        System.out.println("issue: " + issue);
        for (int i = 0; i < issue; i++) {
            String is = substring(file, i, issueLength);
            for (int j = 0; j < spaceLength; j++) {
                String js = substring(is, j, length);
                int space = Integer.parseInt(js);
                box.space(space).increase();
            }
            int i1 = i + 1;
            for (Ball ball : box.getSpace().values()) {
                ball.rate(i1, spaceLength);
            }
            if (spaceLength * length < issueLength) {
                int time = Integer.parseInt(substring(is, spaceLength, length));
                box.time(time).increase();
                for (Ball ball : box.getTime().values()) {
                    ball.rate(i1, 1);
                }
            }
        }
        return box;
    }

    public static String substring(String s, int i, int length) {
        int beginIndex = i * length;
        return s.substring(beginIndex, beginIndex + length);
    }
}
