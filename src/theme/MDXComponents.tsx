import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import BrowserOnly from '@docusaurus/BrowserOnly';
import SimulatorRunGuide from '@site/src/components/SimulatorRunGuide';
import BlocksNextStep, {BlocksJavaContinue} from '@site/src/components/blocks/BlocksNextStep';

function BlockPractice({lessonId}: {lessonId: string}): React.JSX.Element {
  return (
    <BrowserOnly fallback={<p>Loading the block workspace...</p>}>
      {() => {
        const Client = require('@site/src/components/blocks/BlockPractice').default;
        return <Client lessonId={lessonId} />;
      }}
    </BrowserOnly>
  );
}

export default {
  ...MDXComponents,
  SimulatorRunGuide,
  BlockPractice,
  BlocksNextStep,
  BlocksJavaContinue,
};
