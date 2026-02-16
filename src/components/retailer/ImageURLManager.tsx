'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle } from 'lucide-react';

export function ImageURLManager({ name = "imageUrls" }: { name?: string }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-4 rounded-lg border p-4">
        <div>
            <FormLabel>Image URLs</FormLabel>
            <FormDescription className="pt-1">
                Provide up to 4 direct URLs to your item's images. The first will be the main image.
            </FormDescription>
        </div>
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`${name}.${index}.value` as const}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input {...field} placeholder="https://example.com/image.jpg" />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
       <FormField
        control={control}
        name={name}
        render={() => (
             <FormMessage />
        )}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: '' })}
        disabled={fields.length >= 4}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Image URL
      </Button>
    </div>
  );
}
