import React from 'react';
import {Composition, Still} from 'remotion';
import {Reel, TOTAL} from './Reel';
import {Cover} from './Cover';
export const Root: React.FC = () => (<>
  <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  <Still id="Cover" component={Cover} width={1080} height={1920} defaultProps={{photo: 'img/up09.jpg', kicker: 'ASTON MARTIN', title: 'Valhalla Spider', sub: '', pos: '42% 50%'}} />
</>);
