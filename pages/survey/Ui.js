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

        .button-bar > :global(button:not(:first-of-type)) {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          border-left-width: 0;
        }

        .button-bar > :global(button:not(:last-of-type)) {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
      `}</style>
    </div>
  );
}


export function Content({ children, footer }) {
  return (
    <div className="content" data-with-footer={Boolean(footer)}>
      <main>
        {children}
      </main>
      {footer && (
        <footer>
          {footer}
        </footer>
      )}

      <style jsx>{`
        .content {
          display: flex;
          flex-direction: column;
        }

        .content[data-with-footer="true"] {
          height: 100%;
          overflow: auto;
          overflow-x: hidden;
          overflow-y: auto;
        }

        main {
          flex: 1;

          width: 100%;
          max-width: 768px;
          margin: 0 auto;
        }

        footer {
          flex: 0 0 auto;

          width: 100%;
          max-width: 768px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}

export function ProgressBar({ now, total }) {
  const progress = Math.ceil(1 + 99 * (1.0 * now / total));

  return (
    <div
      className="progress-bar"
      aria-valuenow={now}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div className="progress-background progress-inner">
        <div aria-hidden="true" className="progress-text">
          {progress} %
        </div>
        <div className="progress-indicator progress-inner"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style jsx>{`
        .progress-bar {
          padding: 12px 8px;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .progress-text {
          display: block;
          height: 0;
          width: 100%;
          overflow: visible;
        }

        .progress-inner {
          border-radius: 4px;
        }

        .progress-background {
          background-color: #666;
        }

        .progress-indicator {
          min-height: 14px;
          background-color: rgb(31, 101, 179);
          transition: all 200ms;
        }
      `}</style>
    </div>
  );
}

/**
 * @param {{ label: string, multiLine?: boolean, error?: string, name: string } & Object} param
 */
export function Textbox({ label, name, multiLine, error, ...props }) {
  return (
    <div className="has-float-label" data-has-error={Boolean(error)}>
      {multiLine ? (
        <textarea name={name} id={name} placeholder={label} {...props} />
      ) : (
        <input type="text" name={name} id={name} placeholder={label} {...props} />
      )}
      <label htmlFor={name}>{label}</label>

      <style jsx>{`
        .has-float-label {
          display: block;
          position: relative;
          margin: 10px 0;
        }
        .has-float-label label {
          position: absolute;
          left: 0.2rem;
          top: 0;
          right: 0;
          cursor: text;
          font-size: 75%;
          opacity: 1;
          will-change: top,font-size,opacity;
          transition: all .175s ease-out;
        }

        .has-float-label textarea, .has-float-label input {
          width: 100%;
          max-width: 100%;
          min-width: 100%;
          font-size: inherit;
          margin-top: 1em;
          margin-bottom: 1px;
          padding: 0.4rem 0.2rem 0.2rem;
          border: 0;
          border-radius: 0;
          border-bottom: 1px solid #aaa;
          background-color: #fff7f2;
        }

        .has-float-label textarea:disabled, .has-float-label input:disabled {
          background-color: #fff;
          color: rgb(100, 100, 100);
        }

        .has-float-label input::placeholder, .has-float-label textarea::placeholder {
          opacity: 1;
          transition: all .2s;
        }

        .has-float-label input:placeholder-shown:not(:focus)::placeholder, .has-float-label textarea:placeholder-shown:not(:focus)::placeholder {
          opacity: 0;
        }
        .has-float-label input:placeholder-shown:not(:focus) + label, .has-float-label textarea:placeholder-shown:not(:focus) + label {
          font-size: 100%;
          opacity: .5;
          top: 1.25em;
          pointer-events: none;
        }
        .has-float-label input:focus, .has-float-label textarea:focus {
          outline: none;
          border-color: rgb(31, 101, 179);
        }

        .has-float-label[data-has-error="true"] label {
          color: #A50203;
        }

        .has-float-label[data-has-error="true"] input,
        .has-float-label[data-has-error="true"] textarea {
          border-color: #A50203;
          background-color: rgb(253, 226, 226);
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
