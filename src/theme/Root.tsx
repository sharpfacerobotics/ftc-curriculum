import React, {type ReactNode} from 'react';
import ReadingProgress from '@site/src/components/ui/ReadingProgress';
import AskLauncher from '@site/src/components/ui/AskLauncher';
import ClickSpark from '@site/src/components/vendor/reactbits/ClickSpark';
import PersonalizationGate from '@site/src/components/PersonalizationGate';
import {LearnerProfileProvider} from '@site/src/telemark/useLearnerProfile';

interface RootProps {
  children: ReactNode;
}

export default function Root({children}: RootProps): React.JSX.Element {
  return (
    <LearnerProfileProvider>
      <PersonalizationGate>
      <ReadingProgress />
      <AskLauncher />
      {/* Wraps the page rather than sitting beside it: the canvas is sized by
          this element, so as a sibling it collapsed to nothing. */}
      <ClickSpark
        sparkColor="var(--tm-accent)"
        sparkSize={8}
        sparkRadius={18}
        sparkCount={7}
        duration={420}
      >
        {children}
      </ClickSpark>
      </PersonalizationGate>
    </LearnerProfileProvider>
  );
}
