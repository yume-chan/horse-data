import { ChangeEvent, Fragment, useState } from 'react';
import './App.css';

interface Statues {
  speed: number;

  stamina: number;

  power: number;

  sprit: number;

  intelligence: number;
}

const Actions = ['Speed', 'Stamina', 'Power', 'Sprit', 'Intelligence', 'Rest', 'Hospital', 'Race'];
type Action = typeof Actions[number];

interface Turn extends Statues {
  action: Action;
}

const races = [12, 27, 34, 44, 56];
const totalTurns = 58;

function StateInput<T extends Statues>({ statues, isPlaceholder, id, onChange }: { statues: T, isPlaceholder: boolean, id: keyof Statues, onChange: (statues: T) => void; }) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...statues,
      [id]: e.target.valueAsNumber || 0,
    });
  };

  return (
    <input
      className={isPlaceholder ? 'placeholder' : ''}
      type="number"
      value={statues[id]}
      onChange={handleChange}
    />
  );
}

function Bar({ current, previous, id, sum, color }: { current: Statues, previous: Statues | undefined, id: keyof Statues, sum: number, color: string, }) {
  let delta = previous ? (() => {
    let delta = current[id] - previous[id];
    if (delta > 0) {
      return '+' + delta;
    }
    if (delta < 0) {
      return delta;
    }
    return '';
  })() : 0;

  return (
    <div style={{ background: color, flexGrow: current[id] / sum, width: 0 }}>
      {(current[id] / sum * 100).toFixed(2) + '%'}
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

function Row({ turns, normalized, index, onChange }: { turns: Turn[], normalized: boolean, index: number, onChange: (statues: Turn[]) => void; }) {
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
    let sum = current.speed + current.stamina + current.power + current.sprit + current.intelligence;
    const previous = findPreviousTurn(turns, index - 1)!;
    bars = (
      <div style={{ display: 'flex', flexDirection: 'row', height: 23 }}>
        <Bar current={current} previous={previous} id="speed" sum={sum} color="#58aef8" />
        <Bar current={current} previous={previous} id="stamina" sum={sum} color="#ee7b67" />
        <Bar current={current} previous={previous} id="power" sum={sum} color="#f2a940" />
        <Bar current={current} previous={previous} id="sprit" sum={sum} color="#ee82a9" />
        <Bar current={current} previous={previous} id="intelligence" sum={sum} color="#55bc81" />
      </div >
    );

    if (!normalized) {
      let max = 0;
      for (const item of turns) {
        if (!item) {
          continue;
        }

        let sum = item.speed + item.stamina + item.power + item.sprit + item.intelligence;
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

  return (
    <Fragment>
      <tr>
        <td rowSpan={isPlaceholder ? 1 : 2}>{index}</td>
        <td rowSpan={isPlaceholder ? 1 : 2}>{races[races.findIndex(x => x < index) + 1] - index}</td>
        <td rowSpan={isPlaceholder ? 1 : 2}>
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
        <td>
          <StateInput statues={current} isPlaceholder={isPlaceholder} id="speed" onChange={handleStateChange} />
        </td>
        <td>
          <StateInput statues={current} isPlaceholder={isPlaceholder} id="stamina" onChange={handleStateChange} />
        </td>
        <td>
          <StateInput statues={current} isPlaceholder={isPlaceholder} id="power" onChange={handleStateChange} />
        </td>
        <td>
          <StateInput statues={current} isPlaceholder={isPlaceholder} id="sprit" onChange={handleStateChange} />
        </td>
        <td>
          <StateInput statues={current} isPlaceholder={isPlaceholder} id="intelligence" onChange={handleStateChange} />
        </td>
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

const initialStatues: Turn[] = getLocalStorageJson<Turn[]>('statues') ?? [{
  action: 'Initial' as unknown as Action,
  speed: 83,
  stamina: 88,
  power: 98,
  sprit: 90,
  intelligence: 91,
}];

function App() {
  const [normalized, setNormalized] = useState(false);
  const [turns, setTurns] = useState(initialStatues);

  const handleTurnsChange = (statues: Turn[]) => {
    localStorage.setItem('statues', JSON.stringify(statues));
    setTurns(statues);
  };

  return (
    <div className="App">
      <label>
        <input type="checkbox" checked={normalized} onChange={e => setNormalized(e.currentTarget.checked)} />
        <span>Normalized</span>
      </label>

      <table>
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
