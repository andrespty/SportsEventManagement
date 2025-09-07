type CategoryWithParticipants = {
  id: number;
  name: string;
  participants: EventParticipant[];
};

export function groupParticipantsByCategory(participants: EventParticipant[]): CategoryWithParticipants[] {
  const categoryMap: Record<number, CategoryWithParticipants> = {};

  participants.forEach((p) => {
    p.categories.forEach((c) => {
      if (!categoryMap[c.id]) {
        categoryMap[c.id] = { ...c, participants: [] };
      }
      categoryMap[c.id].participants.push(p);
    });
  });

  return Object.values(categoryMap);
}
