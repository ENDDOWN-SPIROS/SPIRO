/* Tiny event emitter. AppModel extends it to tell controllers which state keys changed. */
export class Emitter {
  constructor() { this._h = {}; }
  on(evt, fn) { (this._h[evt] ||= []).push(fn); return () => this.off(evt, fn); }
  off(evt, fn) { this._h[evt] = (this._h[evt] || []).filter(f => f !== fn); }
  emit(evt, data) { (this._h[evt] || []).forEach(fn => fn(data)); }
}
