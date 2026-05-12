export const BURELIAI = ['Minecraft', 'Roblox']

export const DIENOS = ['Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis']

export const GRUPES = [
  // Darbo dienos 18:00–19:30
  { id: 'pir-mc-1800', diena: 'Pirmadienis', burelis: 'Minecraft', laikas: '18:00–19:30' },
  { id: 'pir-rb-1800', diena: 'Pirmadienis', burelis: 'Roblox', laikas: '18:00–19:30' },
  { id: 'ant-mc-1800', diena: 'Antradienis', burelis: 'Minecraft', laikas: '18:00–19:30' },
  { id: 'ant-rb-1800', diena: 'Antradienis', burelis: 'Roblox', laikas: '18:00–19:30' },
  { id: 'tre-mc-1800', diena: 'Trečiadienis', burelis: 'Minecraft', laikas: '18:00–19:30' },
  { id: 'tre-rb-1800', diena: 'Trečiadienis', burelis: 'Roblox', laikas: '18:00–19:30' },
  { id: 'ket-mc-1800', diena: 'Ketvirtadienis', burelis: 'Minecraft', laikas: '18:00–19:30' },
  { id: 'ket-rb-1800', diena: 'Ketvirtadienis', burelis: 'Roblox', laikas: '18:00–19:30' },
  { id: 'pen-mc-1800', diena: 'Penktadienis', burelis: 'Minecraft', laikas: '18:00–19:30' },
  { id: 'pen-rb-1800', diena: 'Penktadienis', burelis: 'Roblox', laikas: '18:00–19:30' },
  // Šeštadienis 10:00–11:30
  { id: 'set-mc-1000', diena: 'Šeštadienis', burelis: 'Minecraft', laikas: '10:00–11:30' },
  { id: 'set-rb-1000', diena: 'Šeštadienis', burelis: 'Roblox', laikas: '10:00–11:30' },
  // Šeštadienis 11:45–13:15
  { id: 'set-mc-1145', diena: 'Šeštadienis', burelis: 'Minecraft', laikas: '11:45–13:15' },
  { id: 'set-rb-1145', diena: 'Šeštadienis', burelis: 'Roblox', laikas: '11:45–13:15' },
]

export const MENESIAI = [
  { nr: 9, pavadinimas: 'Rugsėjis' },
  { nr: 10, pavadinimas: 'Spalis' },
  { nr: 11, pavadinimas: 'Lapkritis' },
  { nr: 12, pavadinimas: 'Gruodis' },
  { nr: 1, pavadinimas: 'Sausis' },
  { nr: 2, pavadinimas: 'Vasaris' },
  { nr: 3, pavadinimas: 'Kovas' },
  { nr: 4, pavadinimas: 'Balandis' },
  { nr: 5, pavadinimas: 'Gegužė' },
  { nr: 6, pavadinimas: 'Birželis' },
]

export function getMenesioPavadinimas(nr) {
  return MENESIAI.find(m => m.nr === nr)?.pavadinimas || nr
}

export function getGrupe(id) {
  return GRUPES.find(g => g.id === id)
}

export function grupeLabel(id) {
  const g = getGrupe(id)
  if (!g) return id
  return `${g.diena} ${g.laikas} – ${g.burelis}`
}
