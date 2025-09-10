import React from 'react';
import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import MatchInfo from './MatchInfo';

interface MatchDialogProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

const MatchDialog: React.FC<MatchDialogProps> = ({ match, isOpen, onClose }) => {
  if (!match) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Match Details</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>

              <MatchInfo match={match} />
            
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton position="absolute" right={3} top={3} size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default MatchDialog;
