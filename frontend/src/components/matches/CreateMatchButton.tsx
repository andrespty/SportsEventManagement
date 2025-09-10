import React from 'react';
import { Button, Drawer, CloseButton, ButtonProps } from '@chakra-ui/react';
import MatchCreationForm from '../MatchCreationForm';
import { useOutletContext } from 'react-router-dom';
import BracketBuilder, { BracketBuilderRef } from './BracketBuilder';
import { useToastContext } from '../../context/ToastContext';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';


interface CreateMatchButtonProps extends Omit<ButtonProps, 'onClick'> {}
interface CreateMatchApiResponse {
  id: number;
  category_id: number;
  round: number;
  match_number: number;
  participants: [];
}

const CreateMatchButton: React.FC<CreateMatchButtonProps> = (props) => {

    const { event, refreshEvent } = useOutletContext<EventContext>();
    const { createToast } = useToastContext();
    const [formData, setFormData] = React.useState<{ type?: string; categoryId?: number; participantIds?: number[] }>({});
    const bracketRef = React.useRef<BracketBuilderRef>(null);
    const { token } = useAuth();

    const createMatch = async () => {
        if (!formData.type || !formData.categoryId) {
          createToast({
            title: 'Something is missing',
            description:'Match Type or Category not selected',
            type:'error'
          });
          return;
        }
    
        if (formData.type === 'Single Event') {
          if (formData.participantIds && formData.participantIds?.length <= 1) {
            createToast({
              title: 'Not enough participants',
              description:'Must select at least 2 participants',
              type:'error'
            });
            return;
          }
          try {
            const res = await apiFetch<ApiResponse<CreateMatchApiResponse>>(`/api/events/${event?.id}/categories/${formData.categoryId}/matches`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                participants: formData.participantIds
              }),
            });
            
            if (res.success) {
              refreshEvent();
              createToast({
                title:"Success",
                description: "Match created successfully",
                type:"success"
              });
            } else {
              createToast({
                title:"Error",
                description: res.error?.message || 'Unknown error occurred',
                type:"error"
              });
            }
          } catch (err) {
            createToast({
              title:"Error",
              description: "Something happened",
              type:"error"
            });
          }
        }
    
        if (formData.type === 'Single Elimination Bracket') {
          const payload = bracketRef.current?.getPayload();
          if (!payload) {
            createToast({
              title: "No bracket",
              description: "Could not generate bracket payload",
              type: "error",
            });
            return;
          }
    
          try {
            const res = await apiFetch<ApiResponse<CreateMatchApiResponse>>(`/api/events/${event?.id}/categories/${formData.categoryId}/bracket`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload)
            });
    
            if (res.success) {
              refreshEvent();
              createToast({
                title:"Success",
                description: "Bracket created successfully",
                type:"success"
              });
            } else {
              createToast({
                title: "Error",
                description: res.error?.message || 'Unknown error occurred',
                type: 'error'
              });
            }
          } catch (err) {
            console.error("Failed to create match", err);
          }
        }
      };

    return (
        <>
            <Drawer.Root size="full">
                <Drawer.Backdrop />
                <Drawer.Trigger asChild>
                    <Button colorScheme="blue" {...props}>
                        Create Match
                    </Button>
                </Drawer.Trigger>
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.CloseTrigger />
                        <Drawer.Body>

                            <MatchCreationForm 
                                event={event}
                                onChange={setFormData}
                                value={formData}
                            />
                            <BracketBuilder 
                                ref={bracketRef}
                                participants={
                                    event?.participants.filter((p) => 
                                    p.categories.some((cat) => cat.id === formData.categoryId))
                                        .map((p, i) => ({ ...p, seed: i + 1 }))
                                    || []
                                }
                            />

                        </Drawer.Body>
                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                        <Drawer.Footer>
                            <Drawer.ActionTrigger asChild>
                                <Button variant="outline">
                                    Cancel
                                </Button>
                            </Drawer.ActionTrigger>
                            <Button colorScheme="blue" onClick={createMatch}>
                                Create Match
                            </Button>
                        </Drawer.Footer>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        </>
    );
};

export default CreateMatchButton;