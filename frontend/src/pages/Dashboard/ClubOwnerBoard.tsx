import React from 'react'
import { Box, Heading, Text } from '@chakra-ui/react'
import EventsPage from '../../features/EventsPage'
import { useEvents } from '../../context/EventsContext'

export default function ClubOwnerBoard() {

    const { loading } = useEvents()

  return (
    <Box>
        <Heading>Club Owner</Heading>
        <Text>
            Club owners can create events
        </Text>
        <Text>
            Club owners can request to join events
        </Text>
        <Text>
            Only the club owner that created the event can accept the join request
        </Text>
        <Text>
            Only the club owner that created the event can create categories
        </Text>
        <Text>
            Club owners signed up to an event can add participants to a category
        </Text>
        
        {
            loading 
            ? <Text>Loading evnets...</Text>
            : <EventsPage />
        }
        
    </Box>
  )
}
