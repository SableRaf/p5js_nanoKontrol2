// StatusBanner — an optional, self-contained connection status indicator.
//
// When enabled via the `statusLabel` option, the library injects a small banner
// (and its CSS) into the page and drives it from the controller's connection
// lifecycle, so sketches get a "device connected / not found" label for free —
// no HTML, CSS, or event handlers required on the sketch side.

type StatusKey = 'device-connected' | 'no-device' | 'no-webmidi' | 'connection-lost';
type StatusType = 'ok' | 'warning' | 'error';

interface StatusEntry {
  label: string;
  type: StatusType;
  pulse: boolean;
}

const STATUS: Record<StatusKey, StatusEntry> = {
  'device-connected': { label: 'connected', type: 'ok', pulse: false },
  'no-device': { label: 'not found', type: 'error', pulse: true },
  'no-webmidi': { label: 'WebMIDI is not supported in this browser', type: 'error', pulse: false },
  'connection-lost': { label: 'connection lost', type: 'warning', pulse: false },
};

const STYLE_ID = 'nanokontrol2-status-style';

const CSS = `
#nanokontrol2-status {
  position: fixed;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 10px;
  background: rgba(255, 255, 255, 0.78);
  border-radius: 14px;
  font-family: sans-serif;
  font-size: 13px;
  color: #2e2c2d;
  pointer-events: none;
  z-index: 9999;
}
#nanokontrol2-status.hidden { display: none; }
#nanokontrol2-status.fade-out { animation: nanokontrol2-status-fade-out 0.6s ease forwards; }
@keyframes nanokontrol2-status-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
#nanokontrol2-status .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
#nanokontrol2-status.ok      .dot { background: #22c55e; }
#nanokontrol2-status.warning .dot { background: #f59e0b; }
#nanokontrol2-status.error   .dot { background: #dc2828; }
#nanokontrol2-status.pulse .dot {
  animation: nanokontrol2-status-pulse 1s ease-in-out infinite alternate;
}
@keyframes nanokontrol2-status-pulse {
  from { opacity: 0.4; }
  to   { opacity: 1; }
}
`;

export class StatusBanner {
  private _el: HTMLDivElement | null = null;
  private _dot: HTMLDivElement | null = null;
  private _label: HTMLSpanElement | null = null;
  private _everConnected = false;
  private _hideTimer: ReturnType<typeof setTimeout> | null = null;

  // deviceName — prefixed onto the connection labels, e.g. "nanoKONTROL2".
  constructor(private _deviceName: string) {
    if (typeof document === 'undefined') return; // non-browser environment

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    const el = document.createElement('div');
    el.id = 'nanokontrol2-status';
    const dot = document.createElement('div');
    dot.className = 'dot';
    const label = document.createElement('span');
    el.appendChild(dot);
    el.appendChild(label);

    const mount = () => document.body.appendChild(el);
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });

    this._el = el;
    this._dot = dot;
    this._label = label;

    // Default to "searching / not found" until a device reports in.
    this._apply('no-device');
  }

  /** WebMIDI is unavailable in this browser — terminal error state. */
  noWebMidi(): void {
    this._apply('no-webmidi');
  }

  /** Device is connected; auto-hides after a short delay. */
  connected(): void {
    this._everConnected = true;
    this._apply('device-connected');
    if (!this._el) return;
    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      const el = this._el;
      if (!el) return;
      el.classList.add('fade-out');
      el.addEventListener('animationend', () => el.classList.add('hidden'), { once: true });
    }, 1500);
  }

  /** Device disconnected — distinguishes "never found" from "lost". */
  disconnected(): void {
    this._apply(this._everConnected ? 'connection-lost' : 'no-device');
  }

  private _apply(key: StatusKey): void {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
    const el = this._el;
    if (!el || !this._dot || !this._label) return;

    const s = STATUS[key];
    const prefix = key === 'no-webmidi' ? '' : `${this._deviceName} `;
    this._label.textContent = prefix + s.label;

    el.classList.remove('hidden', 'fade-out', 'ok', 'warning', 'error', 'pulse');
    el.classList.add(s.type);
    if (s.pulse) el.classList.add('pulse');
  }
}
