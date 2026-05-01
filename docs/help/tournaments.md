# Tournament Management

## Creating a Tournament

1. From the admin dashboard, click **Tournaments** under Operations
2. Click **New Tournament**
3. Enter a tournament name and configure settings
4. Save to create the tournament

## Tournament Structure

Tournaments are organized hierarchically:

```
Tournament
  └── Stage (e.g., Group Stage, Quarter Finals)
        └── Group (e.g., Group A, Group B)
              └── Matches
```

### Stages

Stages represent phases of your competition. Common examples:
- Group Stage
- Round of 16
- Quarter Finals
- Semi Finals
- Final

To manage stages:
1. Open a tournament
2. Click **Manage Stages**
3. Add, edit, or reorder stages

### Groups

Groups hold teams that play against each other within a stage.

1. Open a stage
2. Click **New Group** (e.g., "Group A")
3. Use **Assign Teams** to add teams to the group
4. Schedule matches between teams in the group

## Standings

Standings are calculated automatically from completed match results within each group. They include:
- Points (Win = 3, Draw = 1, Loss = 0)
- Goals For / Goals Against
- Goal Difference
- Matches Played

Only tournament matches affect standings. Friendly matches are excluded.

## Archiving Tournaments

Completed tournaments can be archived. Archived tournaments:
- Remain accessible via the Archive page on your public site
- Are no longer shown in the main tournament list
- Preserve all match results and standings

## Tips

- Create all your teams before setting up tournament groups
- You can reuse teams across multiple tournaments
- Standings update automatically when match results change
