// components\ui\image.tsx

import { useState, type ComponentProps } from 'react';
import { Skeleton } from './skeleton';
import { BrokenImage } from '@components/iconography/BrokenImage';

// TODO: handle the case when an image errors but the size is too small to fit the icon and alt text

/**
 * Gracefully handles image loading and broken image links by rendering a
 * skeleton during load and a styled div on error. It prevents layout shift that
 * occurs after an image loads by reserving the required space in the DOM in
 * advance. Takes the same props as an `<img>` element.
 */
function Image(
  props: {
    width: ComponentProps<'img'>['width'];
    height: ComponentProps<'img'>['height'];
  } & ComponentProps<'img'>,
) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageErrored, setImageErrored] = useState<boolean>(false);

  if (!props.width) throw new Error('A width property must be provided');
  if (!props.height) throw new Error('A width height must be provided');

  const resolvedWidth =
    typeof props.width === 'number' ? `${props.width}px` : props.width;
  const resolvedHeight =
    typeof props.height === 'number' ? `${props.height}px` : props.height;

  return (
    <div
      className="relative overflow-clip"
      style={{
        borderRadius: '10px',
        width: resolvedWidth,
        height: resolvedHeight,
        ...props.style,
      }}
    >
      {isLoading ? (
        <Skeleton
          className={'absolute'}
          style={{ width: resolvedWidth, height: resolvedHeight }}
        />
      ) : null}
      {imageErrored ? (
        <div
          className={
            'absolute overflow-clip bg-slate-400 flex flex-col gap-6 items-center justify-center'
          }
          style={{ width: resolvedWidth, height: resolvedHeight }}
        >
          <BrokenImage
            width={'20%'}
            className="stroke-slate-200 fill-slate-200"
          />
          <p className="text-3xl">{props.alt ?? 'Could not load image'}</p>
        </div>
      ) : null}
      <img
        {...props}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageErrored(true);
          setIsLoading(false);
        }}
        alt={props.alt}
        style={{
          display: imageErrored || isLoading ? 'none' : props.style?.display,
        }}
      />
    </div>
  );
}

export { Image };
