# Chrome Extension Architecture

## UX choice

Use Chrome Side Panel, not popup, for the primary UI.

Reasons:
- remains visible beside interview tab
- supports long-running session
- suitable for chat history
- easier status/debug rendering

## Suggested source tree

```text
extension/
  public/
    manifest.json
  src/
    background/
      service-worker.ts
    sidepanel/
      App.tsx
      components/
        Header.tsx
        StartSession.tsx
        AudioSource.tsx
        ChatWindow.tsx
        ChatBubble.tsx
        CandidateContextControls.tsx
        StatusBar.tsx
        ErrorBanner.tsx
        DevPanel.tsx
    audio/
      tab-capture.ts
      audio-context.ts
      vad.ts
      segmenter.ts
    realtime/
      sse-client.ts
      websocket-client.ts
    api/
      client.ts
      interview.api.ts
    state/
      interview.store.ts
    types/
      interview.ts
      events.ts
```

## Side Panel states

- idle
- requesting_permission
- connecting
- listening
- speech_detected
- segment_finalizing
- transcribing
- question_ready
- thinking
- streaming_answer
- completed
- disconnected
- error

Phase 2 implements the text-only subset: `idle`, `connected`, `thinking`, `streaming`, and `error`.

Phase 3 capture state is independent of chat state and uses: `requesting_permission`, `connecting`, `listening`, `stopped`, and `error`.

## Phase 2 implementation

- `public/manifest.json` declares Manifest V3, the `side_panel` entry point, a module service worker, and the minimum current permissions: `sidePanel`, `activeTab`, and `tabCapture`.
- The service worker opens the Side Panel when the user clicks the extension action and notifies it when a captured tab closes or begins navigation. It does not receive, store, or transmit media.
- The development API origin is a narrowly scoped host permission for `http://localhost:3000/*`.
- `VITE_API_BASE_URL` configures the extension API base URL. It is not a provider-key mechanism; provider keys remain backend-only.
- The development-only manual question form is excluded from production Vite builds.
- The authenticated SSE fetch is aborted on component unmount and when the user
  ends a session. It reconnects with the in-memory interview token after an
  unexpected disconnect.
- Chat auto-scrolls only when the reader is within 72px of the bottom.

## Phase 3 capture behavior

- Start Capture is an explicit Side Panel button action; it targets only the active user-authorized tab through `chrome.tabCapture.getMediaStreamId` followed by `getUserMedia` for tab audio.
- The extension never requests microphone permission and does not capture video.
- Stop Capture, unmount, capture-track end, selected-tab close, and selected-tab navigation stop every MediaStream track, disconnect the source node, and close the AudioContext.
- Audio remains in memory only. Phase 3 has no encoder, persistence, STT request, WebSocket audio transport, or backend audio API call.
- Development diagnostics show stream activity, track state, and sample rate.

## Phase 4 VAD and segmentation

- Voice activity state is shown independently as `Listening`, `Speech detected`, and `Finalizing`.
- While `Speech detected` is active, **Finish** is an explicit end-of-question action. It finalizes only the current utterance and leaves selected-tab capture running for the next question; the automatic silence timeout remains the fallback. **Cancel** discards the currently detected local audio (including during the brief finalizing window), sends nothing to STT or the backend, and returns VAD to listening. After STT has produced a visible transcript, **Cancel question** removes the incorrect transcript and its correlated answer, aborts the backend stream where possible, and leaves capture running for the next turn.
- A finalized in-memory audio segment is emitted once per utterance. It is not sent to the backend in this phase.
- The runtime retains bounded mono PCM frames for pre-roll and emits a
  self-contained WAV file through a packaged `AudioWorklet`. It does not use
  deprecated `ScriptProcessorNode` or concatenate dependent WebM timeslice
  chunks, because later chunks may not contain a valid container header.
- The segmenter blocks a new utterance while the current segment flushes, preventing overlapping finalization.
- Development diagnostics may show only the finalized segment duration; never log audio data or contents.

## Phase 5 transcription behavior

- Each finalized Blob is uploaded once to `POST /api/v1/interviews/:id/transcriptions`
  with its duration in milliseconds and the visible per-segment language hint:
  **Tiếng Việt** or **English**. The selection contains no provider credential
  and can change for the next utterance without restarting capture. The same
  selected mode explicitly determines the AI answer language for that turn.
- The extension immediately renders a temporary interviewer bubble labelled
  `Transcribing…`; the final transcript replaces that bubble when the request
  succeeds.
- Retryable structured backend errors expose a retry action. The Blob is held
  in memory only until success, a non-retryable error, session stop, or panel
  unmount.
- Phase 5 stops at the transcript; Phase 6 starts the AI answer automatically.

## Phase 6 automatic answer behavior

- A `question.transcribed` event creates or reconciles the interviewer bubble.
  The matching `answer.started`, `answer.token`, and `answer.completed` events
  carry both `questionId` and assistant `messageId`.
- The reducer tracks every active assistant message ID, rather than a single
  streaming flag. Concurrent answers therefore append only to their own stable
  bubbles and the panel returns to Connected only after all complete.
- Failed answers leave the transcript intact and expose **Retry answer**. The
  retry uses the failed answer's existing message ID and question correlation.
- Capture and VAD remain active while answers stream. The panel can receive a
  further utterance, transcription, and answer without stopping the selected
  tab capture.
- This is a concurrent-per-turn design: Q2 is not queued behind A1. A
  client-generated `segmentId` reconciles the temporary Q2 bubble with the
  final transcript, then `questionId` and assistant `messageId` route all
  answer lifecycle events. The reducer rejects a token whose question ID does
  not match the assistant bubble, even if a malformed event reuses a message
  ID.

## Capture behavior

The extension must:
1. Require explicit user action to start capture.
2. Capture only the user-selected tab.
3. Show clear active-capture status.
4. Provide a visible Stop button.
5. Stop and release media tracks when session ends.

## Capture UX and recovery

- Session, selected-tab audio, language, sound-meter, and stop/finish actions
  share one compact application header. This leaves the remaining Side Panel
  height to the live conversation while keeping capture state visible.
- The same card keeps the transcription language visible. **Tiếng Việt** sends
  `vi` and **English** sends `en` for each newly finalized segment.
- Capture is unavailable until an interview session exists, preventing a local
  segment that cannot be associated with a backend interview.
- An `activeTab`/Chrome-page failure must be explained in user terms: activate
  a regular interview website, invoke the extension from that tab, and retry.
  The raw browser error must not be the only recovery guidance.
- If `activeTab` capture still cannot start, the panel offers a user-mediated
  Chrome picker fallback. The user must select the interview tab and enable
  **Share tab audio**. This path never processes its required display track:
  it stops it immediately and uses only the selected tab's audio track.
- The user-mediated Chrome picker is the primary compact **Audio** action in
  the Side Panel because its authorization is explicit and visible. Direct
  `activeTab` capture remains available as the smaller **Tab** shortcut. Both
  retain descriptive accessible labels and tooltips despite their short text.
- Session state is shown as a compact header badge. Backend and audio errors use
  separate cards, and technical capture details are collapsed so the interview
  conversation remains the dominant panel region.
- The Side Panel uses a chat-first layout: session and audio actions are compact
  buttons, backend/audio errors are collapsed disclosure buttons, and the chat
  receives the remaining panel height. Conversation text uses a larger reading
  size than control labels.
- The empty chat state distinguishes a session that has not started from a
  connected session waiting for the first interviewer utterance.
- The conversation region is always a distinct bordered **Interview chat**
  panel. Its compact header shows `Off`, `Live`, or the number of messages, so
  capture errors never make the conversation area look absent.
- Development diagnostics and the manual question form live inside a collapsed
  **Developer tools** disclosure and do not consume normal chat height.
- Before the first real turn, the panel renders non-interactive interviewer and
  AI-answer preview bubbles. They explain the conversation layout without
  creating a fake message or calling the backend. Real bubbles show whether a
  question is transcribing or an answer is streaming.
- Phase 11 adds a compact **Profile** menu in the header control row. After
  starting a session, the user may upload a text-based PDF, TXT, or Markdown CV
  and optional JD without reducing the chat area. It shows only filename/status
  and does not display document contents in the Side Panel. The browser sends
  the selected file directly to the authenticated backend; it never receives an
  AI provider key.

## Chat UI

Each interviewer utterance becomes one chat message.

Assistant answer becomes the next message.

Example:

```text
Interviewer
What is Terraform state?

AI Assistant
Terraform state is Terraform's record of the infrastructure
resources it manages...

Terraform • State • Backend • Locking
```

## Dev mode

Development-only controls may include:
- manual question field
- synthetic test audio
- latency metrics
- current session id
- provider status

These controls should be hidden or disabled in production builds.
