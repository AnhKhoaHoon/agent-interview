# Chạy Agent Interview trên Linux

Hướng dẫn này dành cho máy Linux cá nhân hoặc máy chủ riêng. Agent Interview
V1 chỉ hỗ trợ DevOps và chỉ dùng cho luyện tập hoặc phiên phỏng vấn cho phép AI
hỗ trợ. Không public trực tiếp Docker Compose stack này ra Internet.

## 1. Điều kiện cần

- Linux có Docker Engine và Docker Compose v2 (`docker compose version`);
- Git;
- Node.js 22 và npm để build Chrome extension;
- Chrome/Chromium trên máy dùng extension;
- OpenAI API key cho LLM và STT;
- tùy chọn: key có quyền embeddings để index RAG.

Nếu Docker chưa được cài, cài Docker Engine và Compose plugin theo hướng dẫn
chính thức của Docker cho bản phân phối Linux đang dùng. Người chạy lệnh cần có
quyền Docker (hoặc dùng `sudo` theo chính sách máy).

## 2. Lấy source và cấu hình backend

```bash
git clone <repository-url> agent-interview
cd agent-interview
cp .env.example .env
chmod 600 .env
```

Mở `.env` và điền tối thiểu:

```dotenv
LLM_PROVIDER=openai
LLM_API_KEY=<openai-api-key>
LLM_MODEL=gpt-5

STT_PROVIDER=openai
STT_API_KEY=<openai-api-key>
STT_MODEL=gpt-transcribe
STT_LANGUAGE=vi
```

`STT_LANGUAGE` là fallback. Extension gửi hint `vi` hoặc `en` theo lựa chọn
**Tiếng Việt** / **English** cho từng audio segment.

RAG là tùy chọn. Khi dùng RAG, giữ:

```dotenv
RAG_ENABLED=true
EMBEDDING_PROVIDER=openai
# Để trống để dùng LLM_API_KEY, hoặc dùng key embedding riêng:
EMBEDDING_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small
```

Nếu chưa có embedding access, đặt `RAG_ENABLED=false`; STT và AI answer vẫn
hoạt động, chỉ không lấy knowledge từ pgvector.

Không commit `.env`; không đặt provider key trong extension, Chrome storage,
log hoặc source code.

## 3. Khởi động dịch vụ

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Backend tự chạy migration khi khởi động. Kiểm tra trên Linux host:

```bash
curl http://localhost:3000/api/v1/health/live
curl http://localhost:3000/api/v1/health/ready
```

Cả hai phải có `"status":"ok"`. Xem log:

```bash
docker compose logs -f backend
```

Swagger local: `http://localhost:3000/api/docs`.

## 4. Index DevOps knowledge RAG

Knowledge trong `knowledge/` chỉ được dùng bởi RAG sau khi index:

```bash
docker compose exec backend npm run knowledge:index
```

Chạy lại lệnh này sau khi sửa knowledge. Chunks, embedding, source hash và
metadata được lưu trong PostgreSQL/pgvector; model không fine-tune hay tự nhớ
vĩnh viễn knowledge này.

## 5. Build Chrome extension

Build trên máy có Chrome, hoặc build trên Linux rồi copy thư mục `extension/dist`
sang máy Chrome:

```bash
cd extension
cp .env.example .env
npm ci
npm run lint
npm test
```

### Backend và Chrome cùng một máy Linux

```dotenv
# extension/.env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Chrome chạy trên máy khác

Dùng một domain HTTPS qua reverse proxy, ví dụ:

```dotenv
# extension/.env
VITE_API_BASE_URL=https://interview.example.com/api/v1
```

Sửa `extension/public/manifest.json` để `host_permissions` chỉ cho phép đúng
API origin đó, ví dụ `https://interview.example.com/*`. Không đưa port `3000`
trực tiếp ra Internet; dùng reverse proxy HTTPS, firewall và các mục trong
[release checklist](docs/12-release-checklist.md) nếu triển khai ngoài máy
cá nhân.

Build extension:

```bash
npm run build
cd ..
```

Mở `chrome://extensions` trên Chrome:

1. Bật **Developer mode**.
2. Chọn **Load unpacked**.
3. Chọn `extension/dist`.
4. Sao chép Extension ID.

Thêm ID đó vào root `.env`:

```dotenv
CORS_ORIGINS=chrome-extension://<your-extension-id>
```

Nếu extension và backend cùng máy nhưng vẫn dùng Vite development UI, có thể
giữ thêm `http://localhost:5173`. Nạp lại biến môi trường backend:

```bash
docker compose up -d --force-recreate backend
```

Sau mỗi lần đổi code extension: chạy `npm run build`, rồi bấm **Reload** trong
`chrome://extensions`.

## 6. Dùng trong phiên phỏng vấn

1. Mở tab Meet/website có audio interviewer.
2. Khi tab đó active, bấm icon Agent Interview trên Chrome toolbar.
3. Trong Side Panel, bấm **Start**.
4. Chọn **Tiếng Việt** hoặc **English** theo ngôn ngữ interviewer.
5. Bấm **Audio**, chọn đúng tab trong Chrome picker và bật **Share tab audio**.
6. Khi status là **Listening**, audio từ interviewer được nghe.
7. Sau khi interviewer dừng khoảng hai giây, app tự finalize → STT → AI answer.
   Nếu tiếng nền làm app không tự chốt nhưng họ đã nói xong, bấm **Finish**.

Extension chỉ capture audio phát từ tab đã chọn, thường là giọng remote
interviewer; nó không thu trực tiếp microphone của bạn.

Menu **Profile** trong header cho phép upload CV/JD dạng PDF có text, TXT hoặc
Markdown. Raw file và raw audio không được lưu; normalized CV/JD text được lưu
trong PostgreSQL cho phiên đó đến khi Replace, Remove hoặc dữ liệu bị xóa.

## 7. Chẩn đoán nhanh

### Không có transcript

```bash
docker compose logs backend --tail 200 | grep -E 'stt\.openai\.request.failed|stt.failed'
```

- Bật **Share tab audio** và kiểm tra Sound meter có nhảy.
- Chờ hai giây im lặng hoặc bấm **Finish** sau khi câu hỏi thật sự kết thúc.
- Nếu log có `language` và `languages` cùng lúc, backend đang dùng image cũ:

```bash
docker compose up -d --build backend
```

### Có transcript nhưng không có AI answer

```bash
docker compose logs backend --tail 200 | grep -Ei 'answer\.|llm\.|openai'
```

Kiểm tra `LLM_API_KEY`, `LLM_MODEL`, quota và SSE/CORS. Transcript được giữ
lại; dùng **Retry answer** trên bubble đúng thay vì upload lại audio.

### Extension không kết nối backend

Kiểm tra health endpoint, `VITE_API_BASE_URL`, `host_permissions` và
`CORS_ORIGINS` có đúng Extension ID. Sau khi sửa root `.env`, luôn recreate
backend bằng lệnh ở bước 5.

## 8. Vận hành dữ liệu

Tắt containers nhưng giữ database volume:

```bash
docker compose down
```

Xóa toàn bộ database local, RAG index, interview history và stored CV/JD text:

```bash
docker compose down -v
```

Lệnh cuối là destructive; chỉ chạy khi đã chắc chắn không cần dữ liệu. Để
chuyển máy hoặc giữ data, backup/restore PostgreSQL theo
[Operations Runbook](docs/11-runbook.md#backup-and-restore).

## 9. Kiểm tra source trước khi cập nhật

```bash
(cd backend && npm run lint && npm test && npm run build)
(cd extension && npm run lint && npm test && npm run build)
```

Xem thêm [Deployment and Operation Guide](docs/08-deployment.md) cho hardening,
backup, monitoring và release requirements.
