import React, {type ReactNode} from 'react';
import ReadingProgress from '@site/src/components/ui/ReadingProgress';
import AskLauncher from '@site/src/components/ui/AskLauncher';

interface RootProps {
  children: ReactNode;
}

export default function Root({children}: RootProps): React.JSX.Element {
  return (
    <>
      <ReadingProgress />
      <AskLauncher />
      {children}
    </>
  );
}
