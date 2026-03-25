# Visual Scheduler 伺服器部署流程指南

本專案是一個基於 React + Vite 的前端單頁應用程式 (SPA)。以下提供幾種常見的部署方式。

## 1. 本地建置 (Build)

在部署之前，您需要先產出正式環境用的靜態檔案：

```bash
# 安裝依賴
npm install

# 執行建置
npm run build
```

建置完成後，所有的靜態檔案會生成在 `dist/` 目錄下。

---

## 2. GitHub Pages (免費靜態託管)

如果您將程式碼託管在 GitHub 上，可以使用 GitHub Actions 自動部署到 GitHub Pages。

### 步驟 1：確認 Vite 設定
專案中的 `vite.config.ts` 已經設定了 `base: './'`，這能確保在 GitHub Pages 的子路徑下（例如 `https://<username>.github.io/<repo-name>/`）靜態資源能正確載入。

### 步驟 2：啟用 GitHub Actions
專案中已經包含了 GitHub Actions 的設定檔：`.github/workflows/deploy.yml`。

1. 將程式碼推送到您的 GitHub 儲存庫 (Repository)。
2. 前往儲存庫的 **Settings** (設定) 頁籤。
3. 在左側選單找到 **Pages**。
4. 在 **Build and deployment** 區塊中，將 **Source** 更改為 **GitHub Actions**。
5. 只要您將程式碼推送到 `main` 或 `master` 分支，GitHub Actions 就會自動開始建置並部署您的網站。

---

## 3. 其他靜態託管平台 (Vercel / Netlify)

這是最簡單且成本最低的方式，適合沒有後端邏輯的應用程式。

### Vercel / Netlify
1. 將程式碼推送到 GitHub/GitLab。
2. 在 Vercel 或 Netlify 儀表板中關聯該儲存庫。
3. 設定建置參數：
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 點擊部署即可。

---

## 4. 使用 Docker 部署 (容器化)

如果您希望在自己的伺服器或雲端平台（如 Google Cloud Run, AWS Fargate）上執行，可以使用 Docker。

### 建立 `Dockerfile`
在專案根目錄建立 `Dockerfile`：

```dockerfile
# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# 複製自定義 Nginx 設定以支援 SPA 路由
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 建立 `nginx.conf`
為了支援 React Router 的路由功能，需要設定 Nginx 將所有請求導向 `index.html`：

```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 執行 Docker
```bash
docker build -t visual-scheduler .
docker run -p 8080:80 visual-scheduler
```

---

## 5. 傳統 Linux 伺服器 (Nginx)

如果您已有 Linux 伺服器：

1. 將本地編譯好的 `dist/` 資料夾上傳到伺服器（例如 `/var/www/visual-scheduler`）。
2. 設定 Nginx 虛擬主機：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /var/www/visual-scheduler;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

3. 重新啟動 Nginx：`sudo systemctl restart nginx`

---

## 6. 部署注意事項

- **環境變數**: 如果您有使用 `.env` 檔案，請確保在建置環境中設定對應的變數（Vite 需要 `VITE_` 前綴）。
- **HTTPS**: 建議使用 Let's Encrypt (Certbot) 為您的網域加上 SSL 憑證。
- **快取控制**: Nginx 設定中可以加入對 JS/CSS 檔案的長效快取設定，以提升載入速度。
