---
name: led-manual-ownership-invariant
description: Internal/bulk LED writes must use _sendLed, not public setLed, or auto-LED breaks
metadata:
  type: project
---

In `src/MidiController.ts`, the public `setLed(name, on)` sets `_ledManual[name] = true`,
which permanently disables type-driven auto-LED (`_applyAutoLed` returns early when
`_ledManual` is set). This is intentional: explicit user `setLed` should win over auto-LED.

**Invariant:** any *internal* or *bulk* LED write must use the private `_sendLed` instead of
`setLed`, so it does not claim manual ownership. This applies to `_ledStartupSequence` (the
connect flash, touches every button) and `setAllLeds`. Routing those through public `setLed`
flags every button manual and silently kills auto-LED for the rest of the session.

**Why:** discovered 2026-06-29 during the v0.2.0 API migration — momentary buttons stopped
auto-lighting on press because the startup flash had marked them all manual. Fixed by
switching both paths to `_sendLed`.
