import { GridItem, RewardTier } from './types';

export const GRID_CONFIG: GridItem[] = [
  { id: 1, number: 1, weight: 15, tier: RewardTier.SMALL },
  { id: 2, number: 2, weight: 12, tier: RewardTier.SMALL },
  { id: 3, number: 3, weight: 10, tier: RewardTier.NONE },
  { id: 4, number: 4, weight: 8, tier: RewardTier.BIG },
  { id: 5, number: 5, weight: 15, tier: RewardTier.SMALL },
  { id: 6, number: 6, weight: 12, tier: RewardTier.MEDIUM },
  { id: 7, number: 7, weight: 10, tier: RewardTier.NONE },
  { id: 8, number: 8, weight: 10, tier: RewardTier.MEDIUM },
  { id: 9, number: 9, weight: 8, tier: RewardTier.BIG },
];

export const BET_OPTIONS = [10, 50, 100, 500, 1000, 5000];

export const REWARD_MULTIPLIERS = {
  [RewardTier.NONE]: 0,
  [RewardTier.SMALL]: 2,
  [RewardTier.MEDIUM]: 5,
  [RewardTier.BIG]: 20,
};

/**
 * 在这里配置您的自定义图片或视频
 * 如果您想使用本地文件，请将文件放入 public 文件夹，然后使用 "/文件名.mp4" 或 "/图片名.jpg"
 * 如果您想使用网络链接，请直接粘贴 URL (支持 .mp4, .webm, .jpg, .png 等)
 * 如果留空 (null)，系统将继续使用 AI 生成图片
 */
export const CUSTOM_IMAGES = {
  // 默认背景图（球场）
  STADIUM_BG: "https://gd-hbimg-edge.huaban.com/d9df9c0d1d31523b9e3a7587fa28adce3ca78be23d3b1c-EWxglh_fw1200?auth_key=1772164800-b1f9e32a8fce4d7bbdf7f843466f1d3e-0-58f16b6df1dd87b873a019ee3dc6ddf2",
  
  // 游戏开始前的过渡视频
  TRANSITION_VIDEO: "https://aivideo.dustonss.xyz/video/template/1772591127537_354bgi.mp4",

  // 各个状态的美女图
  BABES: {
    IDLE: "https://aivideo.dustonss.xyz/video/template/1772525855691_ghh62s.mp4",   // 初始/邀请状态
    WIN_BIG: [
      "https://aivideo.dustonss.xyz/video/template/1772591401874_m5m8sr.mp4",   // 大奖状态
      "https://aivideo.dustonss.xyz/video/template/1772591514419_ozdhif.mp4", // 小奖状态
      "https://aivideo.dustonss.xyz/video/template/1772593509983_0y2nqv.mp4", // 中奖状态
    ],
    LOSE: [
      "https://aivideo.dustonss.xyz/video/template/1772590900345_j0e16l.mp4",      // 未中奖/安慰状态 1
      "https://aivideo.dustonss.xyz/video/template/1772605892921_y1832c.mp4",      // 未中奖/安慰状态 2
      "https://aivideo.dustonss.xyz/video/template/1772701531657_tdx04w.mp4"       // 未中奖/安慰状态 3
    ],
  },

  // 确认下注时的鼓励视频 (根据下注金额)
  // 您可以在这里替换为您自己的视频链接
  ENCOURAGE_VIDEOS: {
    10: "https://aivideo.dustonss.xyz/video/template/1772603318090_ymd074.mp4",  // 10金币鼓励视频
    50: "https://aivideo.dustonss.xyz/video/template/1772603513279_t4133c.mp4",  // 50金币鼓励视频
    100: "https://aivideo.dustonss.xyz/video/template/1772603532526_2pgdk0.mp4", // 100金币鼓励视频
    500: "https://aivideo.dustonss.xyz/video/template/1772603824520_zipgik.mp4", // 500金币鼓励视频
  } as Record<number, string>
};
