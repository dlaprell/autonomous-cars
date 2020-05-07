// @ts-check

/** @jsx h */
import { h } from 'preact';

export function Button({ children, ...props }) {
  return (
    <button type="button" {...props}>
      {children}

      <style jsx>{`
         button {
          margin-left: auto;

          font-size: 14px;
          font-weight: 300;
          text-transform: uppercase;

          padding: 8px 16px;
          background-color: #eee;
          border-radius: 3px;
          border: 1px solid rgb(31, 101, 179);

          transition: all 200ms;
          cursor: pointer;
        }

        button:disabled {
          cursor: default;
          border-color: #ccc;
          color: #ccc;
        }

        button:not(:disabled):hover, button:not(:disabled):focus {
          background-color: #ddd;
        }

        button:not(:disabled):active {
          background-color: #bbb;
        }
      `}</style>
    </button>
  );
}

export function ButtonBar({ children, align, ...props }) {
  return (
    <div className="button-bar" data-alignment={align || 'right'} {...props}>
      {children}

      <style jsx>{`
        .button-bar[data-alignment="left"] {
          text-align: left;
        }

        .button-bar[data-alignment="center"] {
          text-align: center;
        }

        .button-bar[data-alignment="right"] {
          text-align: right;
        }
      `}</style>
    </div>
  );
}


export function Content({ children, footer }) {
  return (
    <div className="content">
      <main>
        {children}
      </main>
      <footer>
        {footer}
      </footer>

      <style jsx>{`
        .content {
          height: 100%;
          overflow: auto;
          overflow-x: hidden;
          overflow-y: auto;

          display: flex;
          flex-direction: column;

          max-width: 768px;
          margin: 0 auto;
        }

        main {
          flex: 1;
        }

        footer {
          flex: 0 0 auto;
        }
      `}</style>
    </div>
  );
}

export function ProgressBar({ now, total }) {
  const progress = Math.ceil(5 + 95 * (1.0 * now / total));

  return (
    <div
      className="progress-bar"
      aria-valuenow={now}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div className="progress-indicator"
        style={{ width: `${progress}%` }}
      />

      <style jsx>{`
        .progress-bar {
          padding: 12px 8px;
        }

        .progress-indicator {
          border-radius: 4px;
          height: 8px;
          background-color: rgb(31, 101, 179);
          transition: all 200ms;
        }
      `}</style>
    </div>
  );
}

export function SimulationWrapper({ children }) {
  return (
    <div className="canvas-keeper">
      {children}

      <style jsx>{`
        .canvas-keeper {
          display: flex;
          align-items: center;
          flex-direction: row;

          height: 100%;
          width: 100%;
        }

        .canvas-keeper > :global(div) {
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>
    </div>
  );
}
