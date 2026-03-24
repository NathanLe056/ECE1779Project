import React, { useEffect, useState } from "react";
import { TournamentWithDetails } from "../types/Tournament";
import { apiFetch } from "../api/apiClient";

interface TournamentTableProps {
  tournament: TournamentWithDetails;
}

function TournamentTable({ tournament }: TournamentTableProps) {
  const [displayMatches, setDisplayMatches] = useState<TournamentWithDetails["matches"]>(
    tournament.matches
  );
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setDisplayMatches(tournament.matches);
    setMatchesLoading(true);
    setMatchesError(null);

    apiFetch<TournamentWithDetails["matches"]>(`matches/tournament/${tournament.id}`)
      .then((fetchedMatches) => {
        if (!isMounted) return;
        setDisplayMatches(fetchedMatches);
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setMatchesError(error.message || "Failed to load matches");
      })
      .finally(() => {
        if (!isMounted) return;
        setMatchesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tournament.id, tournament.matches]);

  // Seed order follows join/member order to stay consistent with bracket generation.
  const seededMembers = [...tournament.members].sort((a, b) => a.id - b.id);

  const getPlayerName = (index: number, defaultName: string): string => {
    if (index < seededMembers.length) {
      return seededMembers[index].user.username.substring(0, 8);
    }
    return defaultName; // Keep default names like P2, P3, etc.
  };

  // Build bracket with usernames for joined members, defaults for others
  const p1 = getPlayerName(0, "P1");
  const p2 = getPlayerName(1, "P2");
  const p3 = getPlayerName(2, "P3");
  const p4 = getPlayerName(3, "P4");
  const p5 = getPlayerName(4, "P5");
  const p6 = getPlayerName(5, "P6");

  const bracketLayout = [
    "QUARTERFINALS",
    "---------------------------------",
    `${p1.padEnd(8)} --------\\`,
    "                 |-- SF1",
    "BYE      --------/",
    "",
    `${p5.padEnd(8)} --------\\`,
    "                 |-- SF1",
    `${p6.padEnd(8)} --------/`,
    "",
    `${p3.padEnd(8)} --------\\`,
    "                 |-- SF2",
    `${p4.padEnd(8)} --------/`,
    "",
    `${p2.padEnd(8)} --------\\`,
    "                 |-- SF2",
    "BYE      --------/",
    "",
    "SEMIFINALS",
    "---------------------------------",
    "SF1: Winner(P1 vs BYE) vs Winner(P5 vs P6)",
    "",
    "SF2: Winner(P3 vs P4) vs Winner(P2 vs BYE)",
    "",
    "FINAL",
    "---------------------------------",
    "Winner SF1 vs Winner SF2",
  ].join("\n");

  const membersByUserId = new Map(
    tournament.members.map((member) => [member.user.id, member.user.username])
  );

  const seededUserIds = seededMembers.map((member) => member.user_id);

  const fallbackMatches: TournamentWithDetails["matches"] =
    seededUserIds.length >= 6
      ? [
          {
            id: 1,
            tournament_id: tournament.id,
            player1_id: seededUserIds[2],
            player2_id: seededUserIds[3],
            winner_id: null,
            round_number: 1,
            match_order: 1,
            match_status: "not started",
            created_at: tournament.created_at,
          },
          {
            id: 2,
            tournament_id: tournament.id,
            player1_id: seededUserIds[4],
            player2_id: seededUserIds[5],
            winner_id: null,
            round_number: 1,
            match_order: 2,
            match_status: "not started",
            created_at: tournament.created_at,
          },
          {
            id: 3,
            tournament_id: tournament.id,
            player1_id: seededUserIds[0],
            player2_id: -1,
            winner_id: null,
            round_number: 2,
            match_order: 1,
            match_status: "not started",
            created_at: tournament.created_at,
          },
          {
            id: 4,
            tournament_id: tournament.id,
            player1_id: seededUserIds[1],
            player2_id: -1,
            winner_id: null,
            round_number: 2,
            match_order: 2,
            match_status: "not started",
            created_at: tournament.created_at,
          },
          {
            id: 5,
            tournament_id: tournament.id,
            player1_id: -1,
            player2_id: -1,
            winner_id: null,
            round_number: 3,
            match_order: 1,
            match_status: "not started",
            created_at: tournament.created_at,
          },
        ]
      : [];

  const effectiveMatches = displayMatches.length > 0 ? displayMatches : fallbackMatches;

  const getParticipantLabel = (userId: number | null): string => {
    if (userId === null || userId === undefined) return "N/A";
    if (userId === -1) return "TBD";
    if (userId === 0) return "-";
    return membersByUserId.get(userId) ?? `User ${userId}`;
  };

  const quarterfinalMatches = effectiveMatches.filter(
    (match) => match.round_number === 1
  );
  const semifinalMatches = effectiveMatches.filter(
    (match) => match.round_number === 2
  );
  const finalMatches = effectiveMatches.filter(
    (match) => match.round_number === 3
  );

  const renderRoundTable = (
    title: string,
    matches: TournamentWithDetails["matches"]
  ) => (
    <>
      <h3 className="details-subtitle">{title}</h3>
      <div className="details-scroll">
        <table className="details-grid-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Player 1</th>
              <th>Player 2</th>
              <th>Winner</th>
              <th>Order</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td colSpan={7}>No matches yet for this round.</td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.id}>
                  <td>{match.id}</td>
                  <td>{getParticipantLabel(match.player1_id)}</td>
                  <td>{getParticipantLabel(match.player2_id)}</td>
                  <td>{getParticipantLabel(match.winner_id)}</td>
                  <td>{match.match_order}</td>
                  <td>{match.match_status}</td>
                  <td>{new Date(match.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="tournament-details-wrap">
      <div className="details-block">
        <table className="details-table">
            <tbody>
              <tr>
                <th>ID:</th>
                <td>{tournament.id}</td>
              </tr>
              <tr>
                <th>Name:</th>
                <td>{tournament.name}</td>
              </tr>
              <tr>
                <th>Description:</th>
                <td>{tournament.description || "N/A"}</td>
              </tr>
              <tr>
                <th>Bracket Size:</th>
                <td>{tournament.bracket_size}</td>
              </tr>
              <tr>
                <th>Status:</th>
                <td>{tournament.status}</td>
              </tr>
              <tr>
                <th>Created At:</th>
                <td>{new Date(tournament.created_at).toLocaleString()}</td>
              </tr>
              <tr>
                <th>Creator:</th>
                <td>
                  {tournament.creator.username} ({tournament.creator.email})
                </td>
              </tr>
            </tbody>
        </table>
      </div>

      <div className="bracket-preview-wrap">
        <h3 className="details-subtitle">
          BADMINTON TOURNAMENT BRACKET (6 players - 8-slot bracket)
        </h3>
        <pre className="bracket-preview">{bracketLayout}</pre>
      </div>

      <h3 className="details-subtitle">Members</h3>
      <div className="details-scroll">
        <table className="details-grid-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ranking</th>
            </tr>
          </thead>
          <tbody>
            {tournament.members.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.user.username}</td>
                <td>{member.user.email}</td>
                <td>{member.role}</td>
                <td>{member.ranking || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {matchesLoading && <p className="muted-text">Loading matches...</p>}
      {matchesError && <p className="muted-text">{matchesError}</p>}

      {renderRoundTable("Quarterfinals", quarterfinalMatches)}
      {renderRoundTable("Semifinals", semifinalMatches)}
      {renderRoundTable("Finals", finalMatches)}
    </div>
  );
}

export default TournamentTable;