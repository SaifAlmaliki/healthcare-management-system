import React, {ChangeEvent, useState} from 'react';

import {useToast} from '@/components/ui/use-toast';

import SocialMediaLinks from './social-links';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Textarea} from './ui/textarea';

type Props = {
  onReportConfirmation: (data: string) => void;
};

/**
 * ReportComponent
 * A component for handling medical report uploads, processing, and extraction.
 * Supports both image (JPEG, PNG, WebP) and PDF document formats.
 */
const ReportComponent = ({onReportConfirmation}: Props) => {
  const {toast} = useToast();

  const [base64Data, setBase64Data] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState('');
  function handleReportSelection(event: ChangeEvent<HTMLInputElement>): void {
    // Step 1: Check if there are files in the event target
    if (!event.target.files) return;

    // Step 2: Get the first file from the file list
    const file = event.target.files[0];

    // Step 3: Check if a file was selected and validate type
    if (file) {
      let isValidImage = false;
      let isValidDoc = false;
      const validImages = ['image/jpeg', 'image/png', 'image/webp'];
      const validDocs = ['application/pdf'];

      // Check if file is a valid image or document
      if (validImages.includes(file.type)) {
        isValidImage = true;
      }
      if (validDocs.includes(file.type)) {
        isValidDoc = true;
      }

      // Show error if file type is not supported
      if (!(isValidImage || isValidDoc)) {
        toast({
          variant: 'destructive',
          description: 'Filetype not supproted!'
        });
        return;
      }

      // Step 4: Process images with compression
      if (isValidImage) {
        compressImage(file, compressedFile => {
          const reader = new FileReader();

          reader.onloadend = () => {
            const base64String = reader.result as string;
            setBase64Data(base64String);
            console.log(base64String);
          };

          reader.readAsDataURL(compressedFile);
        });
      }

      // Step 5: Process PDFs directly (no compression)
      if (isValidDoc) {
        const reader = new FileReader();
        // Note: PDFs are not compressed. Size limit: 1MB
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setBase64Data(base64String);
          console.log(base64String);
        };

        reader.readAsDataURL(file);
      }
    }
  }

  function compressImage(file: File, callback: (compressedFile: File) => void) {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // Step 1: Initialize canvas for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Step 2: Configure canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image onto the canvas
        ctx!.drawImage(img, 0, 0);

        // Apply basic compression (adjust quality as needed)
        const quality = 0.1; // Adjust quality as needed

        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/jpeg', quality);

        // Step 4: Convert compressed data to File object
        const byteString = atob(dataURL.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const compressedFile = new File([ab], file.name, {type: 'image/jpeg'});

        // Step 5: Return compressed file via callback
        callback(compressedFile);
      };
      img.src = e.target!.result as string;
    };

    reader.readAsDataURL(file);
  }

  /**
   * Extracts details from the uploaded report using Gemini AI
   *
   * Process:
   * 1. Validates presence of report data
   * 2. Sends base64 data to extractreportgemini API
   * 3. Updates UI with extracted report information
   * 4. Handles loading states and error conditions
   */
  async function extractDetails(): Promise<void> {
    if (!base64Data) {
      toast({variant: 'destructive', description: 'Upload a valid report!'});
      return;
    }

    // Step 2: Set loading state for UI feedback
    setIsLoading(true);

    // Step 3: Send report to Gemini AI for processing
    const response = await fetch('/api/ask-ai/extractreportgemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64: base64Data
      })
    });

    // Step 4: Process and display results
    if (response.ok) {
      const reportText = await response.text();
      console.log(reportText);
      setReportData(reportText);
    }

    // Step 5: Reset loading state
    setIsLoading(false);
  }

  return (
    // <div className="grid w-full items-start gap-6">
    <div className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
      <fieldset className="relative grid gap-6 rounded-lg border p-4">
        <legend className="text-sm font-medium">Report</legend>
        {isLoading && <div className={'bg-card/90 absolute z-10 flex size-full flex-row items-center justify-center rounded-lg'}>extracting...</div>}
        <Input
          type="file"
          // accept='image/*'
          onChange={handleReportSelection}
        />
        <Button onClick={extractDetails}>1. Upload File</Button>
        <Label>Report Summary</Label>
        <Textarea
          value={reportData}
          onChange={e => {
            setReportData(e.target.value);
          }}
          placeholder="Extracted data from the report will appear here. Get better recommendations by providing additional patient history and symptoms..."
          className="min-h-72 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
        />
        <Button
          variant="destructive"
          className="bg-[#D90013]"
          onClick={() => {
            onReportConfirmation(reportData);
          }}
        >
          2. Looks Good
        </Button>
        <div className="flex flex-row items-center justify-center gap-2 p-4">
          <Label>Share your thoughts </Label>
          <SocialMediaLinks />
        </div>
      </fieldset>
    </div>
  );
};

export default ReportComponent;
