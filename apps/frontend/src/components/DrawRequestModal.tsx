import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface DrawRequestModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  opponentName?: string;
}

const DrawRequestModal: React.FC<DrawRequestModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  opponentName = 'Your opponent'
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className='bg-stone-800 border-stone-800'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-white font-mono'>
            Draw Request
          </AlertDialogTitle>
          <AlertDialogDescription className='text-white font-mono'>
            {opponentName} has requested a draw. Do you want to accept?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onReject}
            className='font-mono bg-red-600 text-white font-semibold hover:bg-red-700 border-none'
          >
            Reject
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            className='bg-green-600 text-white hover:bg-green-700 font-semibold'
          >
            Accept Draw
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DrawRequestModal;
