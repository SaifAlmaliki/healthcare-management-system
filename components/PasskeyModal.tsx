// This file defines the PasskeyModal component, which is responsible for rendering a modal that prompts the user to enter an admin passkey.
// It handles passkey validation and manages the modal's open state.

'use client';

import Image from 'next/image';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

import {AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle} from '@/components/ui/alert-dialog';
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@/components/ui/input-otp';
import {decryptKey, encryptKey} from '@/utils';

/**
 * PasskeyModal component
 *
 * This component renders a modal that prompts the user to enter an admin passkey.
 * It handles passkey validation and manages the modal's open state.
 */
export const PasskeyModal = () => {
  // Get the router and current path
  const router = useRouter();
  const path = usePathname();

  // Initialize state variables
  const [open, setOpen] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');

  // Retrieve the encrypted access key from local storage
  const encryptedKey = typeof window !== 'undefined' ? window.localStorage.getItem('accessKey') : null;

  // Effect hook to check if the access key matches the expected admin passkey
  useEffect(() => {
    // Decrypt the access key
    const accessKey = encryptedKey && decryptKey(encryptedKey);

    // Check if the access key matches the expected admin passkey
    if (path)
      if (accessKey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY!.toString()) {
        setOpen(false);
        router.push('/admin');
      } else {
        setOpen(true);
      }
  }, [encryptedKey]);

  // Close the modal and redirect to the root page
  const closeModal = () => {
    setOpen(false);
    router.push('/');
  };

  /**
   * Validate the entered passkey
   *
   * @param e React mouse event
   */
  const validatePasskey = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    if (passkey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
      const encryptedKey = encryptKey(passkey);

      localStorage.setItem('accessKey', encryptedKey);

      setOpen(false);
    } else {
      setError('Invalid passkey. Please try again.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start justify-between">
            Admin Access Verification
            <Image src="/assets/icons/close.svg" alt="close" width={20} height={20} onClick={() => closeModal()} className="cursor-pointer" />
          </AlertDialogTitle>
          <AlertDialogDescription>To access the admin page, please enter the passkey.</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <InputOTP maxLength={6} value={passkey} onChange={value => setPasskey(value)}>
            <InputOTPGroup className="shad-otp">
              <InputOTPSlot className="shad-otp-slot" index={0} />
              <InputOTPSlot className="shad-otp-slot" index={1} />
              <InputOTPSlot className="shad-otp-slot" index={2} />
              <InputOTPSlot className="shad-otp-slot" index={3} />
              <InputOTPSlot className="shad-otp-slot" index={4} />
              <InputOTPSlot className="shad-otp-slot" index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="shad-error text-14-regular mt-4 flex justify-center">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={e => validatePasskey(e)} className="shad-primary-btn w-full">
            Enter Admin Passkey
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
