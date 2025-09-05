import { Button, Drawer, CloseButton} from "@chakra-ui/react";
import { ReactNode } from "react";

type ConfirmDialogProps = {
  triggerLabel: string; // button label to open
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
} 

const DrawerComponent = ({
  triggerLabel,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  size,
  ...props
}: ConfirmDialogProps) => {
  return (
    <Drawer.Root size={size} {...props} >
    <Drawer.Backdrop />
      <Drawer.Trigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </Drawer.Trigger>
    <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Title>{title}</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>{body}</Drawer.Body>
            <Drawer.Footer>
              <Drawer.ActionTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onCancel}
                >
                  {cancelLabel}
                </Button>
              </Drawer.ActionTrigger>
              <Button colorScheme="blue" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
    </Drawer.Root>
  );
};

export default DrawerComponent;
