package org.aurorae.cwl.client;

public class CwlUrl {

    private static final String HOST = "http://www.cwl.gov.cn";

    private static final String FIND_DRAW_NOTICE = "/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";

    public static String findDrawNotice() {
        return HOST + FIND_DRAW_NOTICE;
    }
}
