# 故宫 · Forbidden City（Three.js）

手机可预览的故宫中轴线互动网页：护城河、红墙雉堞、午门、金水桥、三大殿（太和 / 中和 / 保和）、配殿廊庑与内廷示意。触控轨道漫游。

A mobile-friendly Forbidden City scene built with **Vite + Three.js** — moat, merlon walls, Meridian Gate, Golden Water Bridges, the Three Great Halls, side colonnades, and a northern inner-palace hint.

## 在线预览 / Live

**https://askirosam.github.io/forbidden-city-threejs/**

用手机浏览器直接打开即可。

## 本地开发 / Dev

```bash
npm install
npm run dev
```

## 构建 / Build

```bash
npm run build
npm run preview
```

产物在 `dist/`。生产站由 `gh-pages` 分支托管（把 `dist/` 内容推上去即可更新 Pages）。

## 操作 / Controls

| 操作 | 手机 | 桌面 |
|------|------|------|
| 旋转 | 单指拖动 | 左键拖动 |
| 缩放 | 双指捏合 | 滚轮 |
| 平移 | 双指拖移 | 右键拖动 |
| 跳转景点 | 底部标签 | 同左 |
| 查看名称 | 轻点建筑 | 点击建筑 |

## 场景内容 / Scene

- 护城河 + 雉堞城墙 + 角楼
- **午门**（U 形阙台）
- **金水桥**（五座石桥）
- **太和门** → **太和殿** → **中和殿** → **保和殿**（递减尺度、汉白玉台基）
- 东西配殿与廊庑
- 内廷示意（乾清门 / 乾清宫一带）

几何为程序化示意造型，非官方数字孪生或实景扫描。

## 技术 / Stack

- Three.js r160 + OrbitControls
- Vite 5
- MeshStandardMaterial、阴影、雾效、ACES 色调映射
- `pixelRatio` 上限 2，兼顾手机性能

## 许可 / License

示例代码可自由使用与修改。
