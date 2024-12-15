package org.aurorae.cwl.client;

import org.aurorae.common.excel.ExcelSheet;
import org.aurorae.cwl.excel.CwlExcelWorkBook;
import org.aurorae.cwl.excel.CwlExcelWriter;
import org.aurorae.cwl.model.Ball;
import org.aurorae.cwl.model.Box;
import org.aurorae.cwl.model.BoxOrder;

public class CwlBox {

    public static final String FILE = CwlFile.read();

    public static void excel() {
        CwlExcelWorkBook workBook = new CwlExcelWorkBook();
        ExcelSheet sheet = workBook.createSheet();
        CwlBox.box()
                .getSpace().forEach((col, ball) -> {
                    int c = Integer.parseInt(col);
                    sheet.row(0).createCell(c).setCellValue(ball.getLabel());
                    ball.getRates().forEach(rate -> sheet.row(rate.getId()).createCell(c).setCellValue(rate.getCount()));
                });
        CwlExcelWriter.write(workBook);
    }

    public static Box box() {
        return box(FILE, 14, 6, 2);
    }

    public static Box box(String file, int issueLength, int spaceLength, int length) {
        Box box = Box.one();
        int issue = file.length() / issueLength;
        box.setIssue(issue);
        System.out.println("issue: " + issue);
        //List<String> spaceOrder = new ArrayList<>();
        for (int i = 0; i < issue; i++) {
            String is = substring(file, i, issueLength);
            for (int j = 0; j < spaceLength; j++) {
                String space = substring(is, j, length);
                box.space(space).increase();
            }
            int i1 = i + 1;
            for (Ball ball : box.getSpace().values()) {
                ball.rate(i1, spaceLength);
            }
            //spaceOrder.add(Ball.sortByCount(box.getSpace().values()));
            if (spaceLength * length < issueLength) {
                String time = substring(is, spaceLength, length);
                box.time(time).increase();
                for (Ball ball : box.getTime().values()) {
                    ball.rate(i1, 1);
                }
            }
        }
        //CwlFile.appendLines(spaceOrder, "SpaceCountOrder.txt");
        return box;
    }

    public static void order() {
        order(FILE, 14, 6, 2);
    }

    public static void order(String file, int issueLength, int spaceLength, int length) {
        BoxOrder box = BoxOrder.one();
        int issue = file.length() / issueLength;
        for (int i = 0; i < issue; i++) {
            String is = substring(file, i, issueLength);
            for (int j = 0; j < spaceLength; j++) {
                String js = substring(is, j, length);
                int space = Integer.parseInt(js);
                BoxOrder.move(box.getSpace(), space);
            }
            if (spaceLength * length < issueLength) {
                int time = Integer.parseInt(substring(is, spaceLength, length));
                BoxOrder.move(box.getTime(), time);
            }
            System.out.println(box.getTime());
        }
        System.out.println(box.getSpace());
        System.out.println(box.getTime());
    }

    public static String substring(String s, int i, int length) {
        int beginIndex = i * length;
        return s.substring(beginIndex, beginIndex + length);
    }
}
