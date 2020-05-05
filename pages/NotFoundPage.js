// @ts-check
/** @jsx h */

import { h } from 'preact';
import { Content } from './survey/Ui';

export default function NotFoundPage() {
  return (
    <Content nextDisabled={true} onNextClick={null}>
      <h1>404 Not found</h1>

      <p>
        The requested resource could not be found.
      </p>
    </Content>
  );
}