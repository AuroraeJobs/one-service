package com.one.record.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.one.common.util.JsonUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.common.exception.NotFoundException;
import com.one.record.ball.ColorBall;
import com.one.record.model.LotteryAstronaut;
import com.one.record.repository.BlueBallRepository;
import com.one.record.repository.LotteryAstronautRepository;
import com.one.record.repository.RedBallRepository;
import com.one.record.response.LotteryAstronautVoyage;
import com.one.record.response.LotteryAstronautVoyageStat;
import com.one.record.service.ILotteryAstronautService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class LotteryAstronautService implements ILotteryAstronautService {

    private static final String CAMP_RED = "RED";
    private static final String CAMP_BLUE = "BLUE";
    private static final String GENDER_MALE = "男性";
    private static final String GENDER_FEMALE = "女性";
    private static final String VOYAGE_STATS_KEY = "lottery:astronaut:voyage-counts";

    private final LotteryAstronautRepository repository;

    private final RedBallRepository redBallRepository;

    private final BlueBallRepository blueBallRepository;

    private final StringRedisTemplate redisTemplate;

    @Override
    public List<LotteryAstronaut> findAll() {
        ensureDefaults();
        return repository.findAllByOrderByCampAscNumberAsc().stream()
                .sorted(Comparator.comparing(LotteryAstronautService::campOrder)
                        .thenComparing(LotteryAstronaut::getNumber))
                .collect(Collectors.toList());
    }

    @Override
    public List<LotteryAstronaut> findByCamp(String camp) {
        ensureDefaults();
        return repository.findByCampOrderByNumberAsc(normalizeCamp(camp));
    }

    @Override
    public LotteryAstronaut save(LotteryAstronaut astronaut) {
        ensureDefaults();
        String camp = normalizeCamp(astronaut.getCamp());
        String number = normalizeNumber(astronaut.getNumber());
        LotteryAstronaut target = repository.findByCampAndNumber(camp, number)
                .orElseThrow(() -> new NotFoundException("宇航员编号不存在: " + camp + "-" + number));
        target.setName(astronaut.getName());
        target.setUpdatedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    @Override
    public List<LotteryAstronaut> saveAll(List<LotteryAstronaut> astronauts) {
        ensureDefaults();
        Map<String, String> nameMap = astronauts.stream()
                .collect(Collectors.toMap(item -> normalizeCamp(item.getCamp()) + "-" + normalizeNumber(item.getNumber()),
                        LotteryAstronaut::getName, (left, right) -> right));
        List<LotteryAstronaut> existing = repository.findAll();
        Long now = System.currentTimeMillis();
        existing.forEach(item -> {
            String key = item.getCamp() + "-" + item.getNumber();
            if (nameMap.containsKey(key)) {
                item.setName(nameMap.get(key));
                item.setUpdatedAt(now);
            }
        });
        repository.saveAll(existing);
        return findAll();
    }

    @Override
    public List<LotteryAstronaut> resetDefaults() {
        repository.deleteAll();
        repository.saveAll(defaultAstronauts());
        return findAll();
    }

    @Override
    public LotteryAstronautVoyage voyage(String camp, String number) {
        ensureDefaults();
        String normalizedCamp = normalizeCamp(camp);
        String normalizedNumber = normalizeNumber(number);
        LotteryAstronaut astronaut = repository.findByCampAndNumber(normalizedCamp, normalizedNumber)
                .orElseThrow(() -> new NotFoundException("宇航员编号不存在: " + normalizedCamp + "-" + normalizedNumber));
        List<? extends ColorBall> matchedRecords = matchedColorBalls(normalizedCamp, normalizedNumber);

        LotteryAstronautVoyage voyage = new LotteryAstronautVoyage();
        voyage.setAstronaut(astronaut);
        voyage.setRecords(voyageRecords(normalizedCamp, matchedRecords));
        return voyage;
    }

    @Override
    public List<LotteryAstronautVoyageStat> calculateVoyageStats() {
        List<LotteryAstronautVoyageStat> stats = new ArrayList<>();
        stats.add(voyageStat(CAMP_RED, redBallRepository.findAll()));
        stats.add(voyageStat(CAMP_BLUE, blueBallRepository.findAll()));
        saveVoyageStats(stats);
        return stats;
    }

    @Override
    public List<LotteryAstronautVoyageStat> getVoyageStats() {
        try {
            String value = redisTemplate.opsForValue().get(VOYAGE_STATS_KEY);
            if (!StringUtils.hasText(value)) {
                return new ArrayList<>();
            }
            return JsonUtil.toObject(value, new TypeReference<List<LotteryAstronautVoyageStat>>() {
            });
        } catch (RuntimeException exception) {
            log.warn("宇航员出行次数读取或反序列化失败，key={}", VOYAGE_STATS_KEY, exception);
        }
        return new ArrayList<>();
    }

    private static LotteryAstronautVoyageStat voyageStat(String camp, List<? extends ColorBall> records) {
        LotteryAstronautVoyageStat stat = new LotteryAstronautVoyageStat();
        stat.setCamp(camp);
        stat.setTotalRecords(records.size());
        int maxNumber = CAMP_RED.equals(camp) ? 33 : 16;
        for (int i = 1; i <= maxNumber; i++) {
            String number = String.format("%02d", i);
            LotteryAstronautVoyageStat.Member member = new LotteryAstronautVoyageStat.Member();
            member.setNumber(number);
            member.setCount((int) records.stream()
                    .filter(record -> record.getRecord() != null && record.getRecord().contains(number))
                    .count());
            stat.getMembers().add(member);
        }
        return stat;
    }

    private void saveVoyageStats(List<LotteryAstronautVoyageStat> stats) {
        try {
            redisTemplate.opsForValue().set(VOYAGE_STATS_KEY, JsonUtil.toJson(stats));
        } catch (RuntimeException exception) {
            log.warn("宇航员出行次数序列化或写入 Redis 失败，key={}", VOYAGE_STATS_KEY, exception);
        }
    }

    private List<? extends ColorBall> matchedColorBalls(String camp, String number) {
        if (CAMP_RED.equals(camp)) {
            return redBallRepository.findByRecordContaining(number);
        }
        return blueBallRepository.findByRecordContaining(number);
    }

    private static List<LotteryAstronautVoyage.VoyageRecord> voyageRecords(String camp, List<? extends ColorBall> records) {
        return records.stream()
                .sorted(Comparator.comparing(ColorBall::getCode).reversed())
                .map(record -> voyageRecord(camp, record))
                .collect(Collectors.toList());
    }

    private static LotteryAstronautVoyage.VoyageRecord voyageRecord(String camp, ColorBall record) {
        LotteryAstronautVoyage.VoyageRecord item = new LotteryAstronautVoyage.VoyageRecord();
        item.setId(record.getCode());
        item.setPeriod(parsePeriod(record.getCode()));
        item.setRaw(record.getRecord());
        item.setPlanetName(record.getPlanet());
        item.setHexagramName(record.getHexagram());
        item.setRedSum(record.getSum());
        item.setOddCount(record.getOddCount());
        item.setEvenCount(record.getEvenCount());
        if (CAMP_RED.equals(camp)) {
            item.setRedNumbers(splitBalls(record.getRecord()));
        } else {
            item.setBlueNumber(record.getRecord());
        }
        return item;
    }

    private static long parsePeriod(String code) {
        try {
            return Long.parseLong(code);
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private static List<String> splitBalls(String record) {
        List<String> balls = new ArrayList<>();
        if (record == null) {
            return balls;
        }
        if (record.contains(",")) {
            for (String ball : record.split(",")) {
                if (StringUtils.hasText(ball)) {
                    balls.add(ball.trim());
                }
            }
            return balls;
        }
        for (int i = 0; i + 2 <= record.length(); i += 2) {
            balls.add(record.substring(i, i + 2));
        }
        return balls;
    }

    private void ensureDefaults() {
        if (repository.count() == 0 || repository.countByCamp(CAMP_RED) != 33 || repository.countByCamp(CAMP_BLUE) != 16) {
            log.info("Initializing lottery astronaut defaults");
            repository.deleteAll();
            repository.saveAll(defaultAstronauts());
        }
    }

    private static int campOrder(LotteryAstronaut astronaut) {
        return CAMP_RED.equals(astronaut.getCamp()) ? 0 : 1;
    }

    private static String normalizeCamp(String camp) {
        String normalized = camp == null ? "" : camp.trim().toUpperCase(Locale.ROOT);
        if (!CAMP_RED.equals(normalized) && !CAMP_BLUE.equals(normalized)) {
            throw new IllegalArgumentException("宇航员阵营必须是 RED 或 BLUE");
        }
        return normalized;
    }

    private static String normalizeNumber(String number) {
        int value = Integer.parseInt(number);
        return value < 10 ? "0" + value : String.valueOf(value);
    }

    private static List<LotteryAstronaut> defaultAstronauts() {
        List<LotteryAstronaut> astronauts = new ArrayList<>();
        String[] firstMaleNames = {
                "刘备", "关羽", "张飞", "诸葛亮", "曹操", "孙权", "赵云", "周瑜", "吕布",
                "司马懿", "宋江", "林冲", "武松", "鲁智深", "孙悟空", "唐僧", "猪八戒"
        };
        String[] firstFemaleNames = {
                "林黛玉", "薛宝钗", "王熙凤", "贾母", "贾元春", "贾探春", "史湘云", "妙玉",
                "贾迎春", "贾惜春", "李纨", "秦可卿", "袭人", "晴雯", "平儿", "香菱"
        };
        String[] secondMaleNames = {
                "李逵", "吴用", "卢俊义", "花荣", "沙僧", "牛魔王", "二郎神", "哪吒"
        };
        String[] secondFemaleNames = {
                "薛宝琴", "鸳鸯", "紫鹃", "小红", "尤二姐", "尤三姐", "邢岫烟", "金钏"
        };
        Long now = System.currentTimeMillis();
        addParityDefaults(astronauts, firstMaleNames, firstFemaleNames, CAMP_RED, "英雄名著", "红楼梦", 33, now);
        addParityDefaults(astronauts, secondMaleNames, secondFemaleNames, CAMP_BLUE, "英雄名著", "红楼梦", 16, now);
        return astronauts;
    }

    private static void addParityDefaults(List<LotteryAstronaut> astronauts, String[] maleNames, String[] femaleNames,
                                          String camp, String maleSource, String femaleSource, int total, Long now) {
        int maleIndex = 0;
        int femaleIndex = 0;
        for (int i = 1; i <= total; i++) {
            boolean male = i % 2 == 1;
            astronauts.add(LotteryAstronaut.builder()
                    .camp(camp)
                    .number(String.format("%02d", i))
                    .name(male ? maleNames[maleIndex++] : femaleNames[femaleIndex++])
                    .gender(male ? GENDER_MALE : GENDER_FEMALE)
                    .source(male ? maleSource : femaleSource)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        }
    }

}
