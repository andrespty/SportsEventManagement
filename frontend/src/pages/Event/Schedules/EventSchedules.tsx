import React, { useState, useRef } from 'react';
import { VStack, Heading, HStack } from '@chakra-ui/react';
import { useAuth } from '../../../context/AuthContext';
import { useToastContext } from '../../../context/ToastContext';
import { apiFetch } from '../../../lib/api';
import { useOutletContext } from 'react-router-dom';
import DrawerComponent from '../../../components/DrawerComponent';
import MatchCreationForm from '../../../components/MatchCreationForm';
import BracketBuilder, { BracketBuilderRef } from '../../../components/matches/BracketBuilder';
import EditMatchDialog from './EditMatchDialog';
import CategoryMatches from './CategoryMatches';

interface CreateMatchApiResponse {
  id: number;
  category_id: number;
  round: number;
  match_number: number;
  participants: [];
}

function EventSchedules() {
  const { event, refreshEvent, isOrganizerOwner } = useOutletContext<EventContext>();
  console.log(event)
  const { token } = useAuth()
  const { createToast } = useToastContext()
  const [formData, setFormData] = useState<{
    type?: string;
    categoryId?: number;
    participantIds?: number[];
  }>({});
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchScores, setMatchScores] = useState<{[key: number]: number}>({});
  const [matchStatus, setMatchStatus] = useState<string>('');

  const [dialogStep, setDialogStep] = useState<'edit' | 'confirm' | 'closeMatch'>('edit');

  const bracketRef = useRef<BracketBuilderRef>(null);

  const createMatch = async () => {
    if (!formData.type || !formData.categoryId){
      createToast({
        title: 'Something is missing',
        description:'Match Type or Category not selected',
        type:'error'
      })
      return
    }
    if (formData.type === 'Single Event'){
      if (formData.participantIds && formData.participantIds?.length <= 1){
        createToast({
            title: 'Not enough participants',
            description:'Must select at least 2 participants',
            type:'error'
        })
        return
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
        if (res.success){
          refreshEvent()
          createToast({
              title:"Success",
              description: "Match created successfully",
              type:"success"
          })
        }
        else{
          createToast({
              title:"Error",
              description: res.error.message,
              type:"error"
          })
        }
      } catch (err) {
        createToast({
              title:"Error",
              description: "Something happened",
              type:"error"
          })
      }
    }
    if (formData.type === 'Single Elimination Bracket'){
      const payload = bracketRef.current?.getPayload();
      if (!payload) {
        createToast({
          title: "No bracket",
          description: "Could not generate bracket payload",
          type: "error",
        });
        return;
      }
      console.log(payload)
      try {
        const res = await apiFetch<ApiResponse<CreateMatchApiResponse>>(`/api/events/${event?.id}/categories/${formData.categoryId}/bracket`, {
          method: "POST",
          headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        });
        if (res.success){
          refreshEvent()
          createToast({
            title:"Success",
            description: "Bracket created successfully",
            type:"success"
          })
        }
        else {
          createToast({
            title: "Error",
            description: res.error.message,
            type: 'error'
          })
        }
      } catch (err) {
        console.error("Failed to create match", err);
      }
    };
  }

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
    setMatchStatus(match.status);
    // Initialize scores and winner from existing match data
    const scores: {[key: number]: number} = {};
    console.log(match)
    match.participants.forEach((mp: MatchParticipant) => {
      if (mp.score !== null && mp.score !== undefined) {
        scores[mp.participant.id] = mp.score;
      }
    });
    
    setMatchScores(scores);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMatch(null);
    setMatchScores({});
    setMatchStatus('');
    setDialogStep('edit');
  };

  const handleScoreChange = (participantId: number, score: number) => {
    setMatchScores(prev => ({
      ...prev,
      [participantId]: score
    }));
  };

  const handleStatusChange = (status: string) => {
    setMatchStatus(status);
  };

  const determineWinnerFromScores = () => {
    if (!selectedMatch) return null;
    
    let highestScore = -1;
    let winnerId: number | null = null;
    
    selectedMatch.participants.forEach((mp: MatchParticipant) => {
      const score = matchScores[mp.participant.id] || 0;
      if (score > highestScore) {
        highestScore = score;
        winnerId = mp.participant.id;
      }
    });
    
    return winnerId;
  };

  const updateMatch = async (
    matchId: number,
    endpoint: string,
    data: any,
    successMessage: string
  ) => {
    try {
      const response = await apiFetch<ApiResponse<any>>(`/apjji/matches/${matchId}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.success) {
        createToast({
          title: 'Success',
          description: successMessage,
          type: 'success'
        });
        return true;
      } else {
        createToast({
          title: 'Error',
          description: response.error?.message || `Failed to ${endpoint}`,
          type: 'error'
        });
        return false;
      }
    } catch (error) {
      createToast({
        title: 'Error',
        description: `An error occurred while ${endpoint}`,
        type: 'error'
      });
      return false;
    }
  };

  const updateMatchData = async (matchId: number) => {
    // Bundle all updates into a single request
    return updateMatch(
      matchId,
      'update',
      {
        scores: matchScores,
        status: matchStatus
      },
      'Match updated successfully'
    );
  };

  const handleSaveMatch = async () => {
    if (!selectedMatch || !isOrganizerOwner) return;

    let success = false;
    
    if (dialogStep === 'closeMatch') {
      const winnerId = determineWinnerFromScores();
      if (!winnerId) {
        createToast({
          title: 'Error',
          description: 'Could not determine winner from scores',
          type: 'error'
        });
        return;
      }
      success = await updateMatch(
        selectedMatch.id,
        'set-winner',
        { 
          winner_id: winnerId,
          scores: matchScores,
          status: 'finished'
        },
        'Match closed and winner set successfully'
      );
    } else {
      // Regular update - update scores and status
      success = await updateMatchData(selectedMatch.id);
    }

    if (success) {
      refreshEvent();
      handleCloseModal();
    }
  };

  return (
    <VStack gap={3} align="stretch">
      <HStack justify={'space-between'}>
        <Heading size="lg">Event Matches</Heading>
        {isOrganizerOwner && (
          <DrawerComponent 
            triggerLabel='Create Match'
            title='Create Match'
            body={
              <>
                <MatchCreationForm 
                    categories={event?.categories} 
                    participants={event?.participants}
                    onChange={setFormData}
                    value={formData}
                />
                {/* Conditional: Bracket */}
                {formData.type && formData.type === "Single Elimination Bracket" && formData.categoryId &&(
                  <BracketBuilder 
                    ref={bracketRef}
                    participants={
                      event?.participants.filter((p) => 
                        p.categories.some((cat) => cat.id === formData.categoryId))
                          .map((p, i) => ({ ...p, seed: i + 1 }))
                      || []
                    }
                  />
                )}
                </>
            }
            onConfirm={createMatch}
            size={'full'}
          />
        )}
      </HStack>

      {event?.categories?.map((category) => (
        <CategoryMatches
          key={category.id}
          category={category}
          onMatchClick={handleMatchClick}
        />
      ))}

      <EditMatchDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        match={selectedMatch}
        matchStatus={matchStatus}
        matchScores={matchScores}
        dialogStep={dialogStep}
        isOrganizerOwner={isOrganizerOwner}
        onStatusChange={handleStatusChange}
        onScoreChange={handleScoreChange}
        onSave={handleSaveMatch}
        setDialogStep={setDialogStep}
      />
    </VStack>
  );
}

export default EventSchedules;