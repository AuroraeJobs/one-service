// 全局颜色配置

// 红球奇偶组合对应的颜色（蓝绿黄红青橙紫）
export const RED_BALL_COMBINATION_COLORS = {
  '地球': '#1890ff', // 蓝
  '水星': '#52c41a', // 绿
  '金星': '#faad14', // 黄
  '火星': '#f5222d', // 红
  '木星': '#13c2c2', // 青
  '土星': '#fa8c16', // 橙
  '天王星': '#722ed1'  // 紫
};

// 蓝球奇偶组合对应的颜色（红紫）
export const BLUE_BALL_COMBINATION_COLORS = {
  '太阳': '#f5222d', // 红
  '月亮': '#722ed1'  // 紫
};

// 基础颜色
export const BASE_COLORS = {
  red: '#f5222d',
  blue: '#1890ff',
  orange: '#fa8c16',
  yellow: '#faad14',
  green: '#52c41a',
  cyan: '#13c2c2',
  purple: '#722ed1'
};

// 全局奇偶组合颜色映射
export const GLOBAL_COMBINATION_COLORS = {
  red: RED_BALL_COMBINATION_COLORS,
  blue: BLUE_BALL_COMBINATION_COLORS
};

// 红球33个号码到红楼梦人物的映射
export const RED_BALL_CHARACTER_MAP: { [key: string]: string } = {
  '01': '薛宝钗', '02': '贾元春', '03': '贾探春', '04': '史湘云', '05': '妙玉',
  '06': '贾迎春', '07': '贾惜春', '08': '王熙凤', '09': '贾巧姐', '10': '李纨',
  '11': '秦可卿', '12': '薛宝琴', '13': '尤二姐', '14': '尤三姐', '15': '邢岫烟',
  '16': '李纹', '17': '李绮', '18': '夏金桂', '19': '秋桐', '20': '小红',
  '21': '龄官', '22': '娇杏', '23': '袭人', '24': '平儿', '25': '鸳鸯',
  '26': '紫鹃', '27': '莺儿', '28': '玉钏', '29': '金钏', '30': '彩云',
  '31': '司棋', '32': '芳官', '33': '麝月'
};

// 蓝球16个号码到红楼梦女性人物的映射
export const BLUE_BALL_CHARACTER_MAP: { [key: string]: string } = {
  '01': '文官', '02': '宝官', '03': '玉官', '04': '药官',
  '05': '莲官', '06': '藕官', '07': '蕊官', '08': '茄官',
  '09': '葵官', '10': '豆官', '11': '艾官', '12': '抱琴',
  '13': '侍书', '14': '入画', '15': '琥珀', '16': '翡翠'
};

// 全局人物映射
export const GLOBAL_CHARACTER_MAPS = {
  red: RED_BALL_CHARACTER_MAP,
  blue: BLUE_BALL_CHARACTER_MAP
};
