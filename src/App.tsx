import { ChangeEventHandler, MouseEventHandler, useState } from "react";
import './App.css';

interface Status {
  speed: number;

  stamina: number;

  power: number;

  sprit: number;

  intelligence: number;
}

type StatusKey = keyof Status;

const StatusKeys: StatusKey[] = ['speed', 'stamina', 'power', 'sprit', 'intelligence'];

const StatusColors: Record<StatusKey, string> = {
  speed: '#58aef8',
  stamina: '#ee7b67',
  power: '#f2a940',
  sprit: '#ee82a9',
  intelligence: '#55bc81',
};

type Location = 'Kyoto' | 'Tokyo' | 'Nakayama' | 'Hanshin';

const TrackName: Record<Location, string> = {
  Kyoto: '京都',
  Tokyo: '東京',
  Nakayama: '中山',
  Hanshin: '阪神',
};

type Grade = 'Debut' | 'GI' | 'GII' | 'GIII';

type Surface = 'turf' | 'dirt';

type Track = 'left-handled' | 'right-handed';

type Side = 'inner' | 'outer' | 'full';

interface Race {
  turn: number;
  title: string;
  grade: Grade;
  location: Location;
  surface: Surface;
  distance: number;
  track: Track;
  side: Side;
  fullGate: number;
}

const KnownRaces: Race[] = [
  {
    turn: 12,
    title: 'ジュニア級メイクデビュー',
    grade: 'Debut',
    location: 'Hanshin',
    surface: 'turf',
    distance: 2000,
    track: 'right-handed',
    side: 'inner',
    fullGate: 9,
  },
];

const Actions = ['Speed', 'Stamina', 'Power', 'Sprit', 'Intelligence', 'Rest', 'Hospital', 'Race'];
type Action = typeof Actions[number];

type Prediction = 'triangle' | 'black-triangle' | 'circle' | 'double-circle';

const PredictionMarks: Record<Prediction, string> = {
  triangle: '△',
  "black-triangle": '▲',
  circle: '○',
  "double-circle": '◎',
};


interface Turn extends Status {
  action: Action;

  predictions: Record<string, Record<StatusKey, Prediction>>;
}

const races = [12, 27, 34, 44, 56];
const totalTurns = 58;

function NumberInput({ className, value, onChange }: { className?: string, value: number, onChange: (value: number) => void; }) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
    onChange(e.target.valueAsNumber ?? 0);
  };

  const handleMinusClick: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    e.stopPropagation();

    let delta: number;
    switch (e.button) {
      case 0:
        delta = 1;
        break;
      case 1:
        delta = 5;
        break;
      default:
        return;
    }

    onChange(Math.max(value - delta, 0));
  };

  const handlePlusClick: MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault();
    e.stopPropagation();

    let delta: number;
    switch (e.button) {
      case 0:
        delta = 1;
        break;
      case 1:
        delta = 5;
        break;
      default:
        return;
    }

    onChange(value + delta);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <button disabled={value === 0} onClick={handleMinusClick} >-</button>
      <input className={className} style={{ flexGrow: 1, textAlign: 'center' }} type="number" min={0} value={value} onChange={handleChange} />
      <button onClick={handlePlusClick}>+</button>
    </div>
  );
}

function StatusInput<T extends Status>({ status, isPlaceholder, id, onChange }: { status: T, isPlaceholder: boolean, id: keyof Status, onChange: (status: T) => void; }) {
  const handleChange = (value: number) => {
    onChange({
      ...status,
      [id]: value,
    });
  };

  return (
    <NumberInput
      className={isPlaceholder ? 'placeholder' : ''}
      value={status[id]}
      onChange={handleChange}
    />
  );
}

function Bar({ current, previous, id, sum, color }: { current: Status, previous: Status | undefined, id: keyof Status, sum: number, color: string, }) {
  const delta = previous ? (() => {
    let delta = current[id] - previous[id];
    if (delta > 0) {
      return '+' + delta;
    }
    if (delta < 0) {
      return delta;
    }
    return '';
  })() : '';

  const percent = current[id] / sum;

  return (
    <div style={{ background: color, flexGrow: percent, width: 0, overflow: 'hidden' }}>
      {(percent * 100).toFixed(2) + '%'}
      {delta}
    </div>
  );
}

function findPreviousTurn(turns: Turn[], index: number) {
  for (let i = index; i >= 0; i -= 1) {
    if (turns[i]) {
      return turns[i];

    }
  }
  return undefined;
}

function Race({ turn, race }: { turn: Turn, race: Race; }) {
  return (
    <>
      <tr>
        <td colSpan={3} rowSpan={2} />
        <td colSpan={6}>{race.title}</td>
      </tr>
      <tr>
        <td>Prediction</td>
        {StatusKeys.map(key => (
          <td key={key}>{turn.predictions[race.title]?.[key]}</td>
        ))}
      </tr>
    </>
  );
}

function Row({ turns, normalized, index, onChange }: { turns: Turn[], normalized: boolean, index: number, onChange: (status: Turn[]) => void; }) {
  let current!: Turn;
  let isPlaceholder!: boolean;
  if (turns[index]) {
    current = turns[index];
    isPlaceholder = false;
  } else {
    current = findPreviousTurn(turns, index)!;
    isPlaceholder = true;
  }

  const handleStateChange = (value: Turn) => {
    const copy = turns.slice();
    copy[index] = value;
    onChange(copy);
  };

  let rowSpan = 1;
  let bars: JSX.Element | null = null;
  if (!isPlaceholder) {
    let sum = StatusKeys.reduce((value, key) => value + current[key], 0);
    if (sum !== 0) {
      const previous = findPreviousTurn(turns, index - 1)!;
      bars = (
        <div style={{ display: 'flex', flexDirection: 'row', height: 23 }}>
          {StatusKeys.map(key => (
            <Bar current={current} previous={previous} id={key} sum={sum} color={StatusColors[key]} />
          ))}
        </div >
      );
      rowSpan += 1;

      if (!normalized) {
        let max = 0;
        for (const turn of turns) {
          if (!turn) {
            continue;
          }

          let sum = StatusKeys.reduce((value, key) => value + turn[key], 0);
          if (sum > max) {
            max = sum;
          }
        }

        bars = (
          <div style={{ width: (sum / max) * 100 + '%' }}>
            {bars}
          </div>
        );
      }

      bars = (
        <tr>
          <td colSpan={5}>
            {bars}
          </td>
        </tr>
      );
    }
  }

  const isRace = races.includes(index);

  const [expanded, setExpanded] = useState(false);
  const handleExpandClick: MouseEventHandler<HTMLButtonElement> = e => {
    setExpanded(value => !value);
  };

  let race: JSX.Element[] | null = null;
  if (expanded) {
    race = KnownRaces.filter(race => race.turn === index).map(race => (
      <Race key={race.title} turn={current} race={race} />
    ));
  }

  return (
    <>
      <tr>
        <td rowSpan={rowSpan}>
          {KnownRaces.some(race => race.turn === index) && (
            <button style={{ width: 20, height: 20, padding: 0, textAlign: 'center', lineHeight: '18px' }} onClick={handleExpandClick}>{expanded ? '-' : '+'}</button>
          )}
        </td>
        <td rowSpan={rowSpan}>{index}</td>
        <td rowSpan={rowSpan}>{races[races.findIndex(x => x >= index)] - index}</td>
        <td rowSpan={rowSpan}>
          {index !== 0 && (
            <select
              disabled={races.includes(index)}
              value={isRace ? 'Race' : isPlaceholder ? '' : current.action}
              onChange={e => handleStateChange({ ...current, action: e.currentTarget.value })}
            >
              <option disabled value=""></option>
              {Actions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          )}
        </td>
        {StatusKeys.map(key => (
          <td>
            <StatusInput status={current} isPlaceholder={isPlaceholder} id={key} onChange={handleStateChange} />
          </td>
        ))}
      </tr>
      {bars}
      {race}
    </>
  );
}

function getLocalStorageJson<T>(key: string): T | undefined {
  let value = localStorage.getItem(key);
  if (!value) {
    return undefined;
  }
  return JSON.parse(value) as T;
}

const initialData: Turn[] = getLocalStorageJson<Turn[]>('status') ?? [{
  action: 'Initial' as unknown as Action,
  speed: 0,
  stamina: 0,
  power: 0,
  sprit: 0,
  intelligence: 0,
  predictions: {},
}];

function App() {
  const [normalized, setNormalized] = useState(false);
  const [turns, setTurns] = useState(initialData);

  const handleTurnsChange = (status: Turn[]) => {
    localStorage.setItem('status', JSON.stringify(status));
    setTurns(status);
  };

  return (
    <div className="App">
      <label>
        <input type="checkbox" checked={normalized} onChange={e => setNormalized(e.currentTarget.checked)} />
        <span>Normalize</span>
      </label>

      <table>
        <thead>
          <tr>
            <td></td>
            <td>Turn</td>
            <td>Next race</td>
            <td>Action</td>
            {StatusKeys.map(key => (
              <td>{key[0].toUpperCase() + key.substring(1)}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: totalTurns }, (_, i) => (
            <Row key={i} turns={turns} index={i} normalized={normalized} onChange={handleTurnsChange} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
