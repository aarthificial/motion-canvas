import {Rect, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInExpo,
  easeInOutExpo,
  sound,
  waitFor,
} from '@motion-canvas/core';
import bookAudio from '../audio/book.wav';

const book = sound(bookAudio).trim(1.1, 3);

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();

  view.add(
    <Rect ref={rect} size={320} radius={80} smoothCorners fill={'#f3303f'} />,
  );

  yield* waitFor(0.3);
  yield* all(
    rect().rotation(90, 1, easeInOutExpo),
    rect().scale(2, 1, easeInOutExpo),
  );
  yield* rect().scale(1, 0.6, easeInExpo);
  rect().fill('#ffa56d');
  book.play();
  yield* all(rect().ripple(1), rect().fill('#f3303f', 1));
  yield* waitFor(2);
});
