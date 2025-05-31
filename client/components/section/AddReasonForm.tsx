// components\section\AddReasonForm.tsx

import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@components/ui/form';
import { Send, Locate, CircleAlert } from 'lucide-react';
import { Textarea } from '@components/ui/textarea';
import { Input } from '@components/ui/input';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCooldown } from '@lib/useCooldown';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@components/ui/tooltip';
import { saveNoteValidationSchema } from '@server/utils';

function AddReasonForm({
  submitCallback,
  focusHandler,
}: {
  submitCallback: (values: z.infer<typeof saveNoteValidationSchema>) => Promise<void>;
  focusHandler?: () => void;
}) {
  const form = useForm<z.infer<typeof saveNoteValidationSchema>>({
    mode: 'onChange',
    resolver: zodResolver(saveNoteValidationSchema),
    defaultValues: {
      message: '',
      latitude: 0,
      longitude: 0,
    },
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(
            `[AddReasonForm] User position obtained: [${position.coords.latitude}, ${position.coords.longitude}]`,
          );
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
          form.clearErrors(['latitude', 'longitude']);
          setLocationStatus('success');
        },
        (error) => {
          console.error(
            '[AddReasonForm] Error while getting position: ',
            error,
          );
          let errorMessage = 'Error getting location. Please try again.';
          // https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
          switch (error.code) {
            case 1: {
              // Permission denied
              errorMessage =
                'We need your location to pin your message to the globe. Please enable it in your browser settings.';
              break;
            }
            case 2: {
              // Position unavailable
              errorMessage = 'Location information is unavailable.';
              break;
            }
            case 3: {
              // Timeout
              errorMessage = 'Request to get user location timed out.';
              break;
            }
          }
          toast.error(errorMessage, {
            position: 'top-left',
            closeButton: true,
            duration: Number.POSITIVE_INFINITY,
          });
          setLocationStatus('error');
        },
        {
          enableHighAccuracy: true,
        },
      );
    } else {
      // Geolocation is not supported by the browser
      console.error(
        '[AddReasonForm] Geolocation is not supported by this browser.',
      );
      toast.error(
        'Your browser does not support geolocation. Unfortunately, we need this feature to pin your message to the globe. Please revisit us on a browser that has it.',
        {
          position: 'top-left',
          closeButton: true,
          duration: Number.POSITIVE_INFINITY,
        },
      );
      setLocationStatus('error');
    }
  }, [form]);

  const [locationStatus, setLocationStatus] = useState<
    'loading' | 'error' | 'success'
  >('loading');

  // hook for making the submit button have an exponential backoff cooldown on
  // successful submits
  const { remainingCooldownSeconds, startCooldown } = useCooldown();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (values) => {
            submitCallback(values)
              .then(() => {
                form.resetField('message');
                startCooldown();
              })
              .catch((error) => {
                console.error(`[AddReasonForm] error submitting form: ${error.message}`)
              });
          },
          (errors) => {
            if (errors.latitude) {
              toast.error(errors.latitude.message, {
                position: 'top-left',
                closeButton: true,
                duration: Number.POSITIVE_INFINITY,
              });
              setLocationStatus('error');
            }
          },
        )}
        style={{ display: 'flex', gap: 16 }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            position: 'relative',
          }}
        >
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem style={{ flexGrow: 1, position: 'relative' }}>
                <FormControl>
                  <Textarea
                    placeholder="Tell the world..."
                    rows={2}
                    maxChars={300}
                    {...field}
                    onBlur={() => {
                      form.clearErrors('message');
                    }}
                    onFocus={focusHandler}
                    style={{ resize: 'none' }}
                    className="border-3 border-slate-700 hover:border-slate-700/90 bg-slate-200"
                    // prevent interaction in the textarea from bubbling up to the scrollPos handler in <Home />
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                      e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </FormControl>
                <FormMessage
                  style={{
                    position: 'absolute',
                    bottom: '-60%',
                    justifySelf: 'center',
                  }}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} type="hidden" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} type="hidden" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              // className="inline-block"
              tabIndex={remainingCooldownSeconds ? 0 : undefined}
              style={{
                cursor:
                  locationStatus !== 'success' || !!remainingCooldownSeconds
                    ? 'not-allowed'
                    : 'default',
              }}
            >
              <Button
                type="submit"
                className={
                  'aspect-square h-16 bg-slate-700 hover:bg-slate-700/90'
                }
                disabled={
                  locationStatus !== 'success' || !!remainingCooldownSeconds
                }
              >
                {remainingCooldownSeconds ? (
                  remainingCooldownSeconds
                ) : locationStatus === 'loading' ? (
                  <Locate className="size-8 stroke-slate-200 animate-pulse" />
                ) : locationStatus === 'error' ? (
                  <CircleAlert className="size-8 stroke-slate-200" />
                ) : (
                  <Send className="size-8 stroke-slate-200" />
                )}
              </Button>
            </span>
          </TooltipTrigger>
          {!!remainingCooldownSeconds && (
            <TooltipContent className={'max-w-3xs'}>
              <p>
                We're thrilled you want to share your thoughts with the world,
                but we need to give others a chance to share theirs, too. While
                you wait, consider checking out some favorites that others have
                submitted!
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </form>
    </Form>
  );
}

export { AddReasonForm };
