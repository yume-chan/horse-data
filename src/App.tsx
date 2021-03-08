import { ChangeEvent, Fragment, useState } from 'react';
import './App.css';

interface Status {
  speed: number;

  stamina: number;

  power: number;

  sprit: number;

  intelligence: number;
}

const StatusKeys: (keyof Status)[] = ['speed', 'stamina', 'power', 'sprit', 'intelligence'];

const StatusColors: Record<keyof Status, string> = {
  speed: '#58aef8',
  stamina: '#ee7b67',
  power: '#f2a940',
  sprit: '#ee82a9',
  intelligence: '#55bc81',
};

const Actions = ['Speed', 'Stamina', 'Power', 'Sprit', 'Intelligence', 'Rest', 'Hospital', 'Race'];
type Action = typeof Actions[number];

interface Turn extends Status {
  action: Action;
}

const races = [12, 27, 34, 44, 56];
const totalTurns = 58;

function StateInput<T extends Status>({ status, isPlaceholder, id, onChange }: { status: T, isPlaceholder: boolean, id: keyof Status, onChange: (status: T) => void; }) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...status,
      [id]: e.target.valueAsNumber || 0,
    });
  };

  return (
    <input
      className={isPlaceholder ? 'placeholder' : ''}
      type="number"
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

  return (
    <Fragment>
      <tr>
        <td rowSpan={bars ? 2 : 1}>{index}</td>
        <td rowSpan={bars ? 2 : 1}>{races[races.findIndex(x => x < index) + 1] - index}</td>
        <td rowSpan={bars ? 2 : 1}>
          {index !== 0 && (
            <select
              disabled={races.includes(index)}
              value={races.includes(index) ? 'Race' : isPlaceholder ? '' : current.action}
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
            <StateInput status={current} isPlaceholder={isPlaceholder} id={key} onChange={handleStateChange} />
          </td>
        ))}
      </tr>
      {bars}
    </Fragment>
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
