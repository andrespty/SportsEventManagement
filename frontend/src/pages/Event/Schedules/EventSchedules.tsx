import React, { useState } from 'react';
import { VStack, Heading, HStack, Flex, Button, Icon } from '@chakra-ui/react';
import { useOutletContext } from 'react-router-dom';
import CreateMatchButton from '../../../components/matches/CreateMatchButton';
import ScheduleView from './ScheduleView';
import { FaList, FaStream } from 'react-icons/fa';

type ViewType = 'list' | 'calendar' | 'timeline';

function EventSchedules() {
  const { event, isOrganizerOwner } = useOutletContext<EventContext>();
  const [currentView, setCurrentView] = useState<ViewType>('list');

  return (
    <VStack gap={3} align="stretch">
      <HStack justify={'space-between'}>
        <Heading size="lg">Event Matches</Heading>
        <Flex>
          <Button
            onClick={() => setCurrentView('list')}
            flex={1}
            borderRightRadius={0}
            bg={currentView === 'list' ? 'blue.500' : 'gray.100'}
            color={currentView === 'list' ? 'white' : 'gray.800'}
            _hover={{
                bg: currentView === 'list' ? 'blue.600' : 'gray.200'
            }}
          >
            <Icon as={FaList} mr={2} />
            Categories
          </Button>
          <Button
            onClick={() => setCurrentView('timeline')}
            flex={1}
            borderLeftRadius={0}
            bg={currentView === 'timeline' ? 'blue.500' : 'gray.100'}
            color={currentView === 'timeline' ? 'white' : 'gray.800'}
            _hover={{
                bg: currentView === 'timeline' ? 'blue.600' : 'gray.200'
            }}
          >
            <Icon as={FaStream} mr={2} />
            Timeline
          </Button>
        </Flex>
        {isOrganizerOwner && <CreateMatchButton size={'sm'} />}
      </HStack>

      <ScheduleView 
        view={currentView} 
        event={event}
      />

    </VStack>
  );
}

export default EventSchedules;