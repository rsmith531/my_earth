import { z } from 'zod';
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
import { Send } from 'lucide-react';
import { Textarea } from '@components/ui/textarea';

const validationSchema = z.object({
  message: z.string().min(1).max(300).trim(),
});

function AddReasonForm({
  submitCallback,
}: {
  submitCallback: (values: z.infer<typeof validationSchema>) => Promise<void>;
}) {
  const form = useForm<z.infer<typeof validationSchema>>({
    mode: 'onChange',
    resolver: zodResolver(validationSchema),
    defaultValues: {
      message: '',
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitCallback)}
        style={{ display: 'flex', gap: 16 }}
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
                  {...field}
                  onBlur={() => {
                    form.clearErrors('message');
                  }}
                  style={{ resize: 'none' }}
                  className="border-3 border-slate-700 hover:border-slate-700/90 bg-slate-200"
                />
              </FormControl>
              <FormMessage
                style={{
                  position: 'absolute',
                  bottom: '-23px',
                  justifySelf: 'center',
                }}
              />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={'aspect-square h-16 bg-slate-700 hover:bg-slate-700/90'}
        >
          <Send className="size-8 stroke-slate-200" />
        </Button>
      </form>
    </Form>
  );
}

export { AddReasonForm };
