import React from "react";
import { TournamentWithDetails } from "../types/Tournament";

interface TournamentTableProps {
  tournament: TournamentWithDetails;
}

function TournamentTable({ tournament }: TournamentTableProps) {
  const bracketLayout = [
    "Quarterfinals",
    "---------------------------------",
    "Match 1: P1  --------\\",
    "                     |-- SF1",
    "Match 2: BYE --------/",
    "",
    "Match 3: P4  --------\\",
    "                     |-- SF1",
    "Match 4: P5  --------/",
    "",
    "Match 5: P3  --------\\",
    "                     |-- SF2",
    "Match 6: P6  --------/",
    "",
    "Match 7: P2  --------\\",
    "                     |-- SF2",
    "Match 8: BYE --------/",
    "",
    "Semifinals",
    "---------------------------------",
    "SF1: Winner(M1/M2) vs Winner(M3/M4)",
    "",
    "SF2: Winner(M5/M6) vs Winner(M7/M8)",
    "",
    "Final",
    "---------------------------------",
    "Winner SF1 vs Winner SF2",
  ].join("\n");

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

      <h3 className="details-subtitle">Matches</h3>
      <div className="details-scroll">
        <table className="details-grid-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Player 1 ID</th>
              <th>Player 2 ID</th>
              <th>Winner ID</th>
              <th>Round</th>
              <th>Order</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {tournament.matches.map((match) => (
              <tr key={match.id}>
                <td>{match.id}</td>
                <td>{match.player1_id}</td>
                <td>{match.player2_id}</td>
                <td>{match.winner_id || "N/A"}</td>
                <td>{match.round_number}</td>
                <td>{match.match_order}</td>
                <td>{match.match_status}</td>
                <td>{new Date(match.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TournamentTable;