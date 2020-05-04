// @ts-check

/** @jsx h */
import { h } from 'preact';

export function Content({ children, nextDisabled, onNextClick }) {
  return (
    <div className="content">
      <main>
        {children}
      </main>
      <footer>
        <button type="button" disabled={Boolean(nextDisabled)} onClick={onNextClick}>
          Next
        </button>
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
          text-align: right;
        }

        footer button {
          margin-left: auto;

          padding: 8px 16px;
        }
      `}</style>
    </div>
  );
}
