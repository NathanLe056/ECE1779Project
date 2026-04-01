import React, { useEffect, useMemo, useState } from "react";
import { TournamentWithDetails } from "../types/Tournament";
import { apiFetch } from "../api/apiClient";
import { updateMatch } from "../api/matchApi";

interface TournamentTableProps {
  tournament: TournamentWithDetails;
  currentUserId: number | null;
}

type MatchRow = TournamentWithDetails["matches"][number];

type RowEditState = {
  match_status: string;
  winner_id: number | null;
};

type RowUiState = {
  saving: boolean;
  success: string | null;
  error: string | null;
};

const MATCH_STATUS_OPTIONS = [
  "not started",
  "pending",
  "completed",
  "cancelled",
  "bypass",
];

function getRoundOrderKey(roundNumber: number, matchOrder: number) {
  return `${roundNumber}-${matchOrder}`;
}

function TournamentTable({ tournament, currentUserId }: TournamentTableProps) {
  const [displayMatches, setDisplayMatches] = useState<TournamentWithDetails["matches"]>(
    tournament.matches
  );
  const [editableRows, setEditableRows] = useState<Record<string, RowEditState>>({});
  const [rowUiState, setRowUiState] = useState<Record<string, RowUiState>>({});
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const canEditMatches =
    currentUserId !== null &&
    currentUserId !== undefined &&
    currentUserId === tournament.created_by;

  const updateRowUiState = (key: string, updates: Partial<RowUiState>) => {
    setRowUiState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        ...updates,
      },
    }));
  };

  useEffect(() => {
    let isMounted = true;

    setDisplayMatches(tournament.matches);
    setEditableRows({});
    setRowUiState({});
    setMatchesLoading(true);
    setMatchesError(null);

    apiFetch<TournamentWithDetails["matches"]>(`matches/tournament/${tournament.id}`)
      .then((fetchedMatches) => {
        if (!isMounted) return;
        setDisplayMatches(fetchedMatches);
        setEditableRows({});
        setRowUiState({});
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

  const getEffectiveRowState = (match: MatchRow): RowEditState => {
    const key = getRoundOrderKey(match.round_number, match.match_order);
    const local = editableRows[key];
    if (local) {
      return local;
    }

    return {
      match_status: match.match_status,
      winner_id: match.winner_id,
    };
  };

  const projectedMatches = useMemo(() => {
    const clones = effectiveMatches.map((match) => ({ ...match }));
    const byKey = new Map(
      clones.map((match) => [getRoundOrderKey(match.round_number, match.match_order), match])
    );

    for (const match of clones) {
      const rowState = getEffectiveRowState(match);
      match.match_status = rowState.match_status;
      match.winner_id = rowState.winner_id;
    }

    const propagateWinner = (
      sourceRound: number,
      sourceOrder: number,
      targetRound: number,
      targetOrder: number,
      targetSlot: "player1_id" | "player2_id"
    ) => {
      const source = byKey.get(getRoundOrderKey(sourceRound, sourceOrder));
      const target = byKey.get(getRoundOrderKey(targetRound, targetOrder));

      if (!source || !target) {
        return;
      }

      const nextParticipant = source.winner_id ?? -1;
      const participantChanged = target[targetSlot] !== nextParticipant;

      if (participantChanged) {
        target[targetSlot] = nextParticipant;
      }

      const winnerInvalid =
        target.winner_id !== null &&
        target.winner_id !== target.player1_id &&
        target.winner_id !== target.player2_id;

      if (participantChanged || winnerInvalid) {
        if (target.winner_id !== null) {
          target.winner_id = null;
        }

        if (["completed", "bypass"].includes(target.match_status)) {
          target.match_status = "pending";
        }
      }
    };

    propagateWinner(1, 1, 2, 2, "player2_id");
    propagateWinner(1, 2, 2, 1, "player2_id");
    propagateWinner(2, 1, 3, 1, "player1_id");
    propagateWinner(2, 2, 3, 1, "player2_id");

    return clones;
  }, [effectiveMatches, editableRows]);

  const getParticipantLabel = (userId: number | null): string => {
    if (userId === null || userId === undefined) return "N/A";
    if (userId === -1) return "TBD";
    if (userId === 0) return "-";
    return membersByUserId.get(userId) ?? `User ${userId}`;
  };

  const quarterfinalMatches = projectedMatches.filter(
    (match) => match.round_number === 1
  );
  const semifinalMatches = projectedMatches.filter(
    (match) => match.round_number === 2
  );
  const finalMatches = projectedMatches.filter(
    (match) => match.round_number === 3
  );

  const finalMatch = finalMatches.find((match) => match.match_order === 1) ?? null;
  const tournamentWinnerName =
    finalMatch && finalMatch.winner_id && finalMatch.winner_id > 0
      ? getParticipantLabel(finalMatch.winner_id)
      : null;
  const isTournamentOver =
    !!finalMatch &&
    tournamentWinnerName !== null &&
    ["completed", "bypass"].includes(finalMatch.match_status);

  const setRowEditState = (match: MatchRow, updates: Partial<RowEditState>) => {
    const key = getRoundOrderKey(match.round_number, match.match_order);
    const baseState = getEffectiveRowState(match);
    const nextState = {
      ...baseState,
      ...updates,
    };

    setEditableRows((prev) => ({
      ...prev,
      [key]: nextState,
    }));

    updateRowUiState(key, { success: null, error: null });
  };

  const handleSaveRow = async (match: MatchRow) => {
    const key = getRoundOrderKey(match.round_number, match.match_order);
    const rowState = getEffectiveRowState(match);

    if (rowState.match_status === "completed" && rowState.winner_id === null) {
      updateRowUiState(key, {
        saving: false,
        success: null,
        error: "Winner is required when match status is completed",
      });
      return;
    }

    updateRowUiState(key, {
      saving: true,
      success: null,
      error: null,
    });

    try {
      const response = await updateMatch(match.id, {
        match_status: rowState.match_status,
        winner_id: rowState.winner_id,
      });

      setDisplayMatches(response.matches);
      setEditableRows({});

      updateRowUiState(key, {
        saving: false,
        success: "Saved",
        error: null,
      });
    } catch (error: any) {
      updateRowUiState(key, {
        saving: false,
        success: null,
        error: error.message || "Failed to save match",
      });
    }
  };

  const renderRoundTable = (
    title: string,
    matches: TournamentWithDetails["matches"]
  ) => (
    <>
      <h3 className="details-subtitle">{title}</h3>
      <div className="round-table-card">
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
              {canEditMatches && <th>Admin</th>}
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td colSpan={canEditMatches ? 8 : 7}>No matches yet for this round.</td>
              </tr>
            ) : (
              matches.map((match) => {
                const rowState = getEffectiveRowState(match);
                const rowKey = getRoundOrderKey(match.round_number, match.match_order);
                const participantChoices = [match.player1_id, match.player2_id].filter(
                  (participantId, index, array) =>
                    participantId > 0 && array.indexOf(participantId) === index
                );
                const winnerDisabled = rowState.match_status !== "completed";
                const rowStateUi = rowUiState[rowKey] || {
                  saving: false,
                  success: null,
                  error: null,
                };

                return (
                  <tr key={match.id}>
                    <td>{match.id}</td>
                    <td>{getParticipantLabel(match.player1_id)}</td>
                    <td>{getParticipantLabel(match.player2_id)}</td>
                    <td>
                      {canEditMatches ? (
                        <select
                          className="match-edit-input"
                          value={rowState.winner_id ?? ""}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setRowEditState(match, {
                              winner_id: nextValue === "" ? null : Number(nextValue),
                            });
                          }}
                          disabled={winnerDisabled || rowStateUi.saving}
                        >
                          <option value="">Select winner</option>
                          {participantChoices.map((participantId) => (
                            <option key={participantId} value={participantId}>
                              {getParticipantLabel(participantId)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getParticipantLabel(match.winner_id)
                      )}
                    </td>
                    <td>{match.match_order}</td>
                    <td>
                      {canEditMatches ? (
                        <select
                          className="match-edit-input"
                          value={rowState.match_status}
                          onChange={(e) => {
                            const nextStatus = e.target.value;
                            setRowEditState(match, {
                              match_status: nextStatus,
                              winner_id:
                                nextStatus === "completed" ? rowState.winner_id : null,
                            });
                          }}
                          disabled={rowStateUi.saving}
                        >
                          {MATCH_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        rowState.match_status
                      )}
                    </td>
                    <td>{new Date(match.created_at).toLocaleString()}</td>
                    {canEditMatches && (
                      <td>
                        <button
                          className="match-save-btn"
                          onClick={() => handleSaveRow(match)}
                          disabled={rowStateUi.saving}
                        >
                          {rowStateUi.saving ? "Saving..." : "Save"}
                        </button>
                        {rowStateUi.success && (
                          <div className="match-row-feedback success">{rowStateUi.success}</div>
                        )}
                        {rowStateUi.error && (
                          <div className="match-row-feedback error">{rowStateUi.error}</div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
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
      {!canEditMatches && (
        <p className="muted-text">
          Bracket is read-only. Only the tournament creator can update match outcomes.
        </p>
      )}

      {renderRoundTable("Quarterfinals", quarterfinalMatches)}
      {renderRoundTable("Semifinals", semifinalMatches)}
      {renderRoundTable("Finals", finalMatches)}

      {isTournamentOver && (
        <div className="tournament-winner-banner" role="status" aria-live="polite">
          <div className="tournament-winner-label">Tournament Winner</div>
          <div className="tournament-winner-name">{tournamentWinnerName}</div>
          <div className="tournament-winner-note">Tournament is over.</div>
        </div>
      )}
    </div>
  );
}

export default TournamentTable;