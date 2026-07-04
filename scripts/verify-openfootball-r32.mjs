import fs from 'node:fs';

const sourceRef =
  process.argv[2] ??
  process.env.OPENFOOTBALL_R32_SOURCE ??
  'https://raw.githubusercontent.com/openfootball/worldcup/master/2026--usa/cup_finals.txt';

const source = sourceRef.startsWith('http')
  ? await fetch(sourceRef).then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch ${sourceRef}: ${response.status}`);
      return response.text();
    })
  : fs.readFileSync(sourceRef, 'utf8');
const data = fs.readFileSync('src/data.ts', 'utf8');

const nameToCode = new Map([
  ['South Africa', 'RSA'], ['Canada', 'CAN'], ['Germany', 'GER'], ['Paraguay', 'PAR'],
  ['Netherlands', 'NED'], ['Morocco', 'MAR'], ['Brazil', 'BRA'], ['Japan', 'JPN'],
  ['France', 'FRA'], ['Sweden', 'SWE'], ['Ivory Coast', 'CIV'], ['Norway', 'NOR'],
  ['Mexico', 'MEX'], ['Ecuador', 'ECU'], ['England', 'ENG'], ['DR Congo', 'COD'],
  ['USA', 'USA'], ['Bosnia & Herzegovina', 'BIH'], ['Belgium', 'BEL'], ['Senegal', 'SEN'],
  ['Portugal', 'POR'], ['Croatia', 'CRO'], ['Spain', 'ESP'], ['Austria', 'AUT'],
  ['Switzerland', 'SUI'], ['Algeria', 'ALG'], ['Argentina', 'ARG'], ['Cape Verde', 'CPV'],
  ['Colombia', 'COL'], ['Ghana', 'GHA'], ['Australia', 'AUS'], ['Egypt', 'EGY'],
]);

const expectedOrder = [74, 77, 73, 75, 76, 78, 79, 80, 83, 84, 81, 82, 86, 88, 85, 87];
const expected = new Map();
const lines = source.split('\n');
for (const rawLine of lines) {
  const line = rawLine.trim();
  const match = line.match(/^\((\d+)\).*?([A-Za-z& ]+?)\s+(\d+)-(\d+).*?\s+([A-Za-z& ]+?)\s+@/);
  if (!match) continue;
  const [, numberText, homeName, homeGoals, awayGoals, awayName] = match;
  const number = Number(numberText);
  if (!expectedOrder.includes(number)) continue;
  const hasPens = line.includes('pen.');
  const penMatch = line.match(/,\s*(\d+)-(\d+)\s+pen\./);
  const homeCode = nameToCode.get(homeName.trim());
  const awayCode = nameToCode.get(awayName.trim());
  if (!homeCode || !awayCode) throw new Error(`Missing code mapping for ${homeName} / ${awayName}`);
  let winner;
  if (hasPens && penMatch) {
    winner = Number(penMatch[1]) > Number(penMatch[2]) ? homeCode : awayCode;
  } else {
    winner = Number(homeGoals) > Number(awayGoals) ? homeCode : awayCode;
  }
  expected.set(number, { number, home: homeCode, away: awayCode, homeGoals: Number(homeGoals), awayGoals: Number(awayGoals), winner });
}

const fixtureBlocks = [...data.matchAll(/id: "R32-(\d+)",[\s\S]*?scoreNote: "[^"]+",\n  \}/g)].map((match) => {
  const block = match[0];
  const getString = (key) => block.match(new RegExp(`${key}: "([^"]+)"`))?.[1];
  const getNumber = (key) => Number(block.match(new RegExp(`${key}: (\\d+)`))?.[1]);
  return {
    number: Number(match[1]),
    home: getString('home'),
    away: getString('away'),
    status: getString('status'),
    homeGoals: getNumber('homeGoals'),
    awayGoals: getNumber('awayGoals'),
    winner: getString('winner'),
  };
});

const errors = [];
const actualOrder = fixtureBlocks.map((fixture) => fixture.number);
if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
  errors.push(`R32 order mismatch: ${actualOrder.join(',')} !== ${expectedOrder.join(',')}`);
}
for (const fixture of fixtureBlocks) {
  const wanted = expected.get(fixture.number);
  if (!wanted) {
    errors.push(`Unexpected R32 fixture ${fixture.number}`);
    continue;
  }
  for (const key of ['home', 'away', 'homeGoals', 'awayGoals', 'winner']) {
    if (fixture[key] !== wanted[key]) errors.push(`Match ${fixture.number} ${key}: ${fixture[key]} !== ${wanted[key]}`);
  }
  if (fixture.status !== 'actual') errors.push(`Match ${fixture.number} status is ${fixture.status}`);
}
if (fixtureBlocks.length !== 16) errors.push(`Expected 16 R32 fixtures, got ${fixtureBlocks.length}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Verified ${fixtureBlocks.length} Round-of-32 fixtures against ${sourceRef}`);
