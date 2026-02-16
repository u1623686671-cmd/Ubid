'use client';

import { useCallback, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper function to resize the image
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("FileReader did not produce a result."));
      }
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with quality 0.8
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
      img.src = event.target.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export function ImageUploader({ name = "imageUrls" }: { name?: string }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (fields.length + acceptedFiles.length > 4) {
      toast({
        variant: 'destructive',
        title: 'Too many images',
        description: 'You can upload a maximum of 4 images.',
      });
      return;
    }

    setIsProcessing(true);

    for (const file of acceptedFiles) {
      try {
        let fileToProcess = file;
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
        
        if (isHeic) {
            toast({ title: 'Converting HEIC image...', description: 'This may take a moment.' });
            const heic2any = (await import('heic2any')).default;
            const conversionResult = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8,
            });

            const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;

            if (!convertedBlob) {
                throw new Error("HEIC conversion failed to produce a valid image.");
            }
            
            // Create a new File object from the converted blob
            const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpeg');
            fileToProcess = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
        }

        const resizedDataUrl = await resizeImage(fileToProcess, 800, 800);
        append({ value: resizedDataUrl });
      } catch (error) {
        console.error("Image processing error:", error);
        toast({
          variant: 'destructive',
          title: 'Image Error',
          description: `Could not process the file: ${file.name}. It might be a corrupted or unsupported format.`,
        });
      }
    }
    setIsProcessing(false);
  }, [fields.length, append, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.webp', '.heic', '.heif'] },
    maxSize: 5 * 1024 * 1024, // 5MB before resize
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach(error => {
            if (error.code === 'file-too-large') {
                 toast({ variant: 'destructive', title: `File too large: ${file.name}`, description: 'Please upload images under 5MB.' });
            } else if (error.code === 'file-invalid-type') {
                 toast({ variant: 'destructive', title: `Invalid file type: ${file.name}`, description: 'Please upload a valid image file (jpeg, png, heic, etc.).' });
            } else {
                 toast({ variant: 'destructive', title: `Error with ${file.name}`, description: error.message });
            }
        });
      });
    },
  });

  return (
    <div className="space-y-4 rounded-lg border p-4">
        <div>
            <FormLabel>Images</FormLabel>
            <FormDescription className="pt-1">
                Upload up to 4 images from your device. The first will be the main image.
            </FormDescription>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fields.map((field, index) => (
                <div key={field.id} className="relative aspect-square group">
                    <Image
                        src={(field as any).value}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover rounded-md border"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(index)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>

      {fields.length < 4 && (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary hover:text-primary transition-colors',
            isDragActive && 'border-primary bg-primary/10'
          )}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin"/>
                <p>Processing images...</p>
              </div>
          ) : (
             <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8"/>
                {isDragActive ? <p>Drop the files here</p> : <p>Drag & drop images, or click to browse</p>}
             </div>
          )}
        </div>
      )}
       <FormField
        control={control}
        name={name}
        render={() => (
             <FormMessage />
        )}
      />
    </div>
  );
}
