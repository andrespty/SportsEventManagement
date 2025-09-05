declare module '@g-loot/react-tournament-brackets' {
  import React from 'react';

  export interface Team {
    name: string;
  }

  export interface Match {
    id: string | number;
    teams: Array<Team | null>;
  }

  export interface Round {
    title: string;
    seeds: Match[];
  }

  export interface SingleEliminationBracketProps {
    rounds: Round[];
    matchComponent?: React.ComponentType<any>;
  }

  export const SingleEliminationBracket: React.FC<SingleEliminationBracketProps>;
}
