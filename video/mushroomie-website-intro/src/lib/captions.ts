import type {Caption} from '@remotion/captions';
import captionData from '../content/captions.json';

export type EmphasisFragment = {
  text: string;
  highlighted: boolean;
};

export const CAPTIONS = captionData as Caption[];

export const activeCaptionAt = (
  milliseconds: number,
  captions: readonly Caption[] = CAPTIONS,
) =>
  captions.find(
    ({startMs, endMs}) =>
      milliseconds >= startMs && milliseconds < endMs,
  ) ?? null;

export const splitEmphasis = (
  source: string,
  emphasis: readonly string[],
): EmphasisFragment[] => {
  const phrases = emphasis.filter(Boolean);
  if (phrases.length === 0) {
    return [{text: source, highlighted: false}];
  }

  const sourceLower = source.toLocaleLowerCase('vi');
  const fragments: EmphasisFragment[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const matches = phrases
      .map((phrase) => ({
        phrase,
        index: sourceLower.indexOf(
          phrase.toLocaleLowerCase('vi'),
          cursor,
        ),
      }))
      .filter(({index}) => index >= 0)
      .sort((left, right) =>
        left.index === right.index
          ? right.phrase.length - left.phrase.length
          : left.index - right.index,
      );
    const next = matches[0];

    if (!next) {
      fragments.push({text: source.slice(cursor), highlighted: false});
      break;
    }

    if (next.index > cursor) {
      fragments.push({
        text: source.slice(cursor, next.index),
        highlighted: false,
      });
    }

    const end = next.index + next.phrase.length;
    fragments.push({
      text: source.slice(next.index, end),
      highlighted: true,
    });
    cursor = end;
  }

  return fragments;
};
