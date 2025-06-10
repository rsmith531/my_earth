// components\ui\image.tsx

import { useState, type ComponentProps } from 'react';
import { Skeleton } from './skeleton';
import { BrokenImage } from '@components/iconography/BrokenImage';

/**
 * Gracefully handles image loading and broken image links by rendering a
 * skeleton during load and a styled div on error. It prevents layout shift that
 * occurs after an image loads by reserving the required space in the DOM in
 * advance. Takes the same props as an `<img>` element.
 */
function Image(props: ComponentProps<'img'>) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageErrored, setImageErrored] = useState<boolean>(false);

  const resolvedWidth =
    typeof props.width === 'number' ? `${props.width}px` : props.width;
  const resolvedHeight =
    typeof props.height === 'number' ? `${props.height}px` : props.height;

  return (
    <div
      className="relative overflow-clip"
      style={{
        borderRadius: '10px',
        width: resolvedWidth ?? 'fit-content',
        height: resolvedHeight ?? 'fit-content',
        ...props.style,
      }}
    >
      {isLoading ? (
        <Skeleton
          className={'absolute'}
          style={{
            width: resolvedWidth,
            height: resolvedHeight,
          }}
        />
      ) : null}
      {imageErrored ? (
        <div
          className={
            'overflow-clip bg-slate-400 flex flex-col gap-2 items-center justify-center p-2 sm:p-4'
          }
          style={{ width: resolvedWidth, height: resolvedHeight }}
        >
          {(resolvedHeight === undefined ||
            Number.parseInt(String(resolvedHeight)) > 100) && (
            <BrokenImage
              width={'20%'}
              className="stroke-slate-200 fill-slate-200"
            />
          )}
          <h4 className="text-center">{props.alt ?? 'Could not load image'}</h4>
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
          objectFit: 'contain',
          height: '100%',
          aspectRatio: 'auto',
        }}
      />
    </div>
  );
}

export { Image };
