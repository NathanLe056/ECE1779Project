import React from "react";
import { TournamentWithDetails } from "../types/Tournament";

interface TournamentTableProps {
  tournament: TournamentWithDetails;
}

function TournamentTable({ tournament }: TournamentTableProps) {
  return (
    <div>
      <h2 className="mb-4">Tournament Details</h2>

      <div className="card mb-4">
        <div className="card-body">
          <table className="table table-striped">
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
      </div>

      <h3>Members</h3>
      <div className="table-responsive">
        <table className="table table-striped">
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

      <h3>Matches</h3>
      <div className="table-responsive">
        <table className="table table-striped">
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