# 故宫 · Forbidden City（Three.js）

手机可预览的低多边形故宫互动网页：红墙、金顶、中轴线（午门 → 太和门广场 → 太和殿），触控轨道漫游。

A mobile-friendly, low-poly Forbidden City scene built with Three.js — red walls, golden roofs, central axis (Meridian Gate → courtyard → Hall of Supreme Harmony), touch orbit controls.

## 本地打开 / Open locally

本项目为**纯静态**站点（无构建步骤）。因使用 ES modules + CDN，请用本地 HTTP 服务打开，不要直接双击 `file://`。

```bash
cd forbidden-city-threejs
python3 -m http.server 8080
```

然后在浏览器打开：`http://localhost:8080`  
手机同一局域网可访问：`http://<你的电脑IP>:8080`

## GitHub Pages 部署说明 / GitHub Pages

1. 将本仓库推送到 GitHub（公开仓库）。
2. Settings → Pages → Source 选 **Deploy from a branch**，分支 `main`，文件夹 `/ (root)`。
3. 若仓库名为 `USERNAME.github.io`，站点根路径即为 `https://USERNAME.github.io/`。
4. 若仓库名为其他名（如 `forbidden-city-threejs`），站点地址为：
   `https://USERNAME.github.io/forbidden-city-threejs/`
   - 当前相对路径引用（`./styles.css`、`./main.js`）**已兼容子路径**，一般无需改 `base`。
5. 等待 1–2 分钟后用手机浏览器打开上述 URL。

## 操作 / Controls

| 操作 | 手机 | 桌面 |
|------|------|------|
| 旋转 | 单指拖动 | 左键拖动 |
| 缩放 | 双指捏合 | 滚轮 |
| 平移 | 双指拖移 | 右键拖动 |
| 跳转景点 | 底部标签按钮 | 同左 |

## 技术 / Stack

- [Three.js](https://threejs.org/) r160（jsDelivr CDN）
- `OrbitControls`（examples/jsm）
- 无打包工具；`importmap` 加载模块

## 文件 / Files

```
forbidden-city-threejs/
├── index.html
├── main.js
├── styles.css
├── README.md
└── .gitignore
```

## 许可 / License

示例代码可自由使用与修改。故宫形象为示意几何造型，非官方数字孪生。
