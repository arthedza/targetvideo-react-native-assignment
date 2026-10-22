import Svg, { Path } from 'react-native-svg';

import { colors } from './theme';

const paths = {
  comment: 'M21 11a9 9 0 0 1-9 9H4l-3 3V11a10 10 0 0 1 20 0Z',
  plus: 'M12 4v16M4 12h16',
  check: 'm5 12 4 4L19 6',
  reset: 'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-2l2 3M4 16l2 3a8 8 0 0 0 13-2',
  back: 'm15 18-6-6 6-6',
  chevron: 'm9 6 6 6-6 6',
  play: 'm8 5 11 7-11 7Z',
  pause: 'M8 5v14M16 5v14',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  share: 'M12 16V2m-4 4 4-4 4 4M7 9H4v13h16V9h-3',
  lock: 'M6 11h12v10H6ZM8 11V7a4 4 0 0 1 8 0v4',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',
  home: 'm3 10 9-8 9 8v11h-6v-7H9v7H3Z',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  bell: 'M5 17h14l-2-3V8A5 5 0 0 0 7 8v6ZM10 21h4',
  profile: 'M21 21a9 9 0 0 0-18 0M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  flame:
    'M13 2c1 5-4 6-3 10 1-1 2-2 2-4 4 3 7 6 6 10a7 7 0 0 1-14-1c0-4 3-6 4-8-1 4 1 5 2 5 1-4 4-6 3-12Z',
  sparkle: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  bookmark: 'M6 3h12v19l-6-4-6 4Z',
  episodes: 'M3 5h3m4 0h11M3 12h3m4 0h11M3 19h3m4 0h11',
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  color = colors.muted,
  filled = false,
}: Readonly<{
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <Path
        d={paths[name]}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
