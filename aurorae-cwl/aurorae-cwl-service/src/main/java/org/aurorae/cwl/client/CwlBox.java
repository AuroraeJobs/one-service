package org.aurorae.cwl.client;

import org.aurorae.cwl.model.Ball;
import org.aurorae.cwl.model.Box;

public class CwlBox {

    public static final String FILE = CwlFile.read("all.txt");

    public static Box box() {
        return box(FILE, 14, 6, 2);
    }

    public static Box box(String file, int issueLength, int spaceLength, int length) {
        Box box = Box.one();
        int issue = file.length() / issueLength;
        System.out.println("issue: " + issue);
        //List<String> spaceOrder = new ArrayList<>();
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
            //spaceOrder.add(Ball.sortByCount(box.getSpace().values()));
            if (spaceLength * length < issueLength) {
                int time = Integer.parseInt(substring(is, spaceLength, length));
                box.time(time).increase();
                for (Ball ball : box.getTime().values()) {
                    ball.rate(i1, 1);
                }
            }
        }
        //CwlFile.appendLines(spaceOrder, "SpaceCountOrder.txt");
        return box;
    }

    public static String substring(String s, int i, int length) {
        int beginIndex = i * length;
        return s.substring(beginIndex, beginIndex + length);
    }
}
