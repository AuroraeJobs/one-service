package org.aurorae.core.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.Gua;
import org.aurorae.core.model.Gua64;
import org.aurorae.core.model.Xiang;
import org.aurorae.core.model.Yi;
import org.aurorae.core.repository.Gua64Repository;
import org.aurorae.core.service.Gua64Service;
import org.aurorae.core.service.GuaService;
import org.aurorae.core.service.XiangService;
import org.aurorae.core.service.YiService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author aurorae
 */
@Service
@Component
@Slf4j
public class Gua64ServiceImpl implements Gua64Service {

    @Resource
    private Gua64Repository repository;

    @Resource
    private YiService yiService;

    @Resource
    private XiangService xiangService;

    @Resource
    private GuaService guaService;

    @Override
    public List<Gua64> findAll() {
        List<Yi> yis = yiService.findAll();
        List<Xiang> xiangs = xiangService.findAll();
        List<Gua> guas = guaService.findAll();
        return repository.findAll().stream().peek(item -> {
            item.setHigh(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(0)))).findAny().orElse(null));
            item.setFive(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(1)))).findAny().orElse(null));
            item.setFour(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(2)))).findAny().orElse(null));
            item.setThree(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(3)))).findAny().orElse(null));
            item.setTwo(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(4)))).findAny().orElse(null));
            item.setStart(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(5)))).findAny().orElse(null));

            item.setTian(xiangs.stream().filter(xiang -> xiang.getCode().equals(item.getCode().substring(0, 2))).findAny().orElse(null));
            item.setRen(xiangs.stream().filter(xiang -> xiang.getCode().equals(item.getCode().substring(2, 4))).findAny().orElse(null));
            item.setDi(xiangs.stream().filter(xiang -> xiang.getCode().equals(item.getCode().substring(4, 6))).findAny().orElse(null));

            item.setUp(guas.stream().filter(gua -> gua.getCode().equals(item.getCode().substring(0, 3))).findAny().orElse(null));
            item.setLow(guas.stream().filter(gua -> gua.getCode().equals(item.getCode().substring(3, 6))).findAny().orElse(null));
        }).collect(Collectors.toList());
    }

    @Override
    public List<Gua64> save(List<Gua64> items) {
        return repository.saveAll(items);
    }

    public static void main(String[] args) throws IOException {
        List<String> sortById = Arrays.asList(
                "乾", "姤", "同人", "遁", "履", "讼", "无妄", "否",
                "小畜", "巽", "家人", "渐", "中孚", "涣", "益", "观",
                "大有", "鼎", "离", "旅", "睽", "未济", "噬嗑", "晋",
                "大畜", "蛊", "贲", "艮", "损", "蒙", "颐", "剥",
                "夬", "大过", "革", "咸", "兑", "困", "随", "萃",
                "需", "井", "既济", "蹇", "节", "坎", "屯", "比",
                "大壮", "恒", "丰", "小过", "归妹", "解", "震", "豫",
                "泰", "升", "明夷", "谦", "临", "师", "复", "坤");
        List<String> sortByYi = Arrays.asList(
                "乾", "坤", "屯", "蒙", "需", "讼", "师", "比",
                "小畜", "履", "泰", "否", "同人", "大有", "谦", "豫",
                "随", "蛊", "临", "观", "噬嗑", "贲", "剥", "复",
                "无妄", "大畜", "颐", "大过", "坎", "离", "咸", "恒",
                "遁", "大壮", "晋", "明夷", "家人", "睽", "蹇", "解",
                "损", "益", "夬", "姤", "萃", "升", "困", "井",
                "革", "鼎", "震", "艮", "渐", "归妹", "丰", "旅",
                "巽", "兑", "涣", "节", "中孚", "小过", "既济", "未济");
        for (int i = 0; i < 64; i++) {
            System.out.println("\"" + i + "(" + sortByYi.get(i) + ")\":\"" + sortById.indexOf(sortByYi.get(i)) + "(" + String.format("%06d", Integer.parseInt(Integer.toBinaryString(sortById.indexOf(sortByYi.get(i))))) + ")\",");
            if (i % 2 != 0) {
                System.out.println();
            }
            // 创建文件
            // new File("/Users/aurorae/Downloads/易经/" + i + "-" +sortByYi.indexOf(sortById.get(i)) + sortById.get(i) + "卦.json").createNewFile();
            // System.out.printf("{\"id\":%s, \"code\":\"%s\", \"label\":\"%s\"},%n", i, String.format("%06d", Integer.parseInt(Integer.toBinaryString(i))), gua64.get(i));
        }
    }
}
