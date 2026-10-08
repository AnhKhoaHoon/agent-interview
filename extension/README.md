# Chrome Extension

Chrome Manifest V3 Side Panel for the DevOps interview text path, tab-audio
capture, VAD segmentation, and Phase 5 transcription upload.

## Local build

```bash
cd extension
cp .env.example .env
npm ci
npm run build
```

`VITE_API_BASE_URL` defaults to `http://localhost:3000/api/v1`. It is the only extension environment variable and must contain no provider credential or backend secret.

Start the backend separately with its local Docker Compose command before using the panel.

The complete backend setup, generated extension ID/CORS handshake, end-to-end
interview flow, production build requirements, and rollback procedure are in
[the deployment and operation guide](../docs/08-deployment.md).

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the generated `extension/dist` directory.
5. Pin Agent Interview if desired, then click its toolbar icon to open the Side Panel.

Copy the extension ID shown on that page into the backend `CORS_ORIGINS` value as `chrome-extension://YOUR_EXTENSION_ID`, then restart the backend. The backend must allow the extension origin for both REST and SSE requests.

When the API base URL changes for a non-local environment, update the narrowly-scoped `host_permissions` entry in `public/manifest.json` to match that API origin, rebuild, and reload the unpacked extension.

## Phase 2 flow

`Start session` creates a DevOps interview, keeps its per-session access token
in memory, and opens an authenticated fetch-based SSE stream. `answer.token`
events append to an assistant bubble until `answer.completed`. End session
aborts that stream and calls the protected backend end endpoint.

Audio capture, microphone, STT, VAD, and RAG are outside the Phase 2 shell; the Phase 3 capture boundary is documented below.

## Phase 3 tab capture

With the interview tab active, open the Side Panel and explicitly select **Start capture**. Chrome authorizes only that active tab's audio through `tabCapture`; the extension does not request microphone access.

If Chrome reports that `activeTab` was not invoked, activate a regular interview
website tab, click the Agent Interview toolbar icon from that tab, then retry.
Chrome internal pages such as `chrome://` cannot be captured.

**Start capture** now opens Chrome's picker by default. Select the Google Meet
tab and enable **Share tab audio** before confirming. The smaller **Use active
tab** action keeps the direct `activeTab` path available. The extension
immediately stops the picker-required display track and processes only the
shared tab audio.

The production Side Panel is chat-first. Session and audio operations use
single-row compact controls with short labels and accessible descriptions,
while backend/audio errors stay collapsed until opened. The conversation fills
the remaining viewport height. Development diagnostics and the manual question
form are grouped inside collapsed **Developer tools**, so they do not displace
the chat during normal testing.

The unified application header also shows a transcription-language selector. Choose **Tiếng
Việt** for Vietnamese interviewer audio or **English** for English. The
selected hint travels with the next audio segment; it is not a provider key and
does not require restarting capture.

The **Interview chat** panel remains visible even when capture cannot start.
It shows whether the session is waiting or has messages; capture guidance is
separate so an audio-permission error does not hide the conversation history.
Before the first live turn it shows labelled Interviewer and AI answer preview
bubbles only; they are visual guidance and are not sent to the backend.

The panel displays capture state, a visible **Stop capture** control, and development diagnostics for stream activity, audio-track state, and sample rate. Stop, Side Panel unmount, captured-tab close, captured-tab navigation, or track interruption release every MediaStream track, media source node, and AudioContext.

Phase 3 keeps audio in memory only for local diagnostics. It does not store, encode, upload, transcribe, or send audio to the backend.

## Phase 4 VAD and utterance segments

While capture is active, the Side Panel detects interviewer speech and shows **Listening**, **Speech detected**, or **Finalizing**. Configuration is centralized in `src/audio/vad-config.ts`:

- minimum speech: 300 ms
- silence timeout: 1,000 ms
- pre-roll: 250 ms
- post-roll: 300 ms
- maximum utterance: 30 s

One local `Blob` segment is finalized per sustained utterance after one second of silence and post-roll. Once **Speech detected** appears, **Finish** can explicitly end the current question sooner; **Cancel** discards the currently detected local audio before STT upload. Neither button stops capture, so the next question can still be heard. Once an interviewer transcript is visible, **Cancel question** removes an incorrect transcript and its correlated answer, asks the backend to abort its stream, and keeps tab capture active for the next question. Silence-only audio is ignored, the start is protected with pre-roll, and no new finalization overlaps a pending one. Development logs and diagnostics expose only segment duration; they never expose audio contents.

## Phase 5 transcription

Each finalized segment is uploaded as multipart form data to the active
interview's transcription endpoint. The chat immediately displays an
interviewer `Transcribing…` bubble, then replaces it with the transcript. A
retryable structured error shows a retry action. Segment data stays in memory
only until upload success, a non-retryable failure, session stop, or unmount;
it is never saved by the extension.

## Phase 6 automatic answer

On successful transcription, the backend automatically streams a DevOps answer
over the session SSE connection. The Side Panel associates every assistant
bubble and token with its `questionId` and assistant `messageId`, so a new
utterance can be captured while an earlier answer streams. A failed answer
keeps its interviewer transcript and presents **Retry answer**. Normal builds
need no manual Send button; the manual form remains development-only.

Overlapping turns use concurrent processing: Q2 is captured, transcribed, and
answered without waiting for A1. The reducer places each assistant bubble next
to its question and ignores a token unless both correlation IDs match.
