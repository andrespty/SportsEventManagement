import React from 'react'
import { useOutletContext } from 'react-router-dom';

export default function EventStandings() {
  const { event } = useOutletContext<EventContext>();
  return (
    <div>EventStandings {event.name}</div>
  )
}

