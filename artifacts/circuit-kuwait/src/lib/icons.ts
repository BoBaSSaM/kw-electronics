import { Cpu, Radar, Boxes, CircuitBoard, Wrench, Bot, PlugZap, Cable, Battery, Gauge, type LucideIcon } from 'lucide-react';
export function catIcon(name: string, icon?: string): LucideIcon {
  const s = `${icon ?? ''} ${name}`.toLowerCase();
  if (/sensor/.test(s)) return Radar;
  if (/module/.test(s)) return Boxes;
  if (/tool|solder|meter/.test(s)) return Wrench;
  if (/robot|motor/.test(s)) return Bot;
  if (/power|supply/.test(s)) return PlugZap;
  if (/cable|connector/.test(s)) return Cable;
  if (/batter/.test(s)) return Battery;
  if (/component|resistor|capacitor/.test(s)) return CircuitBoard;
  if (/measure/.test(s)) return Gauge;
  return Cpu;
}
