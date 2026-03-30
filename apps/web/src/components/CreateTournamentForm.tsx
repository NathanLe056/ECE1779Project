import React, { useState } from "react";
import { createTournament } from "../api/tournamentApi";
import { TournamentSummary } from "../types/Tournament";

interface CreateTournamentFormProps {
  onCancel: () => void;
  onCreated: (tournament: TournamentSummary) => void;
}

function CreateTournamentForm({ onCancel, onCreated }: CreateTournamentFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bracketSize = 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      setError("Please complete all fields with valid values.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createTournament({
        name: name.trim(),
        description: description.trim(),
        bracket_size: bracketSize,
        status,
      });
      onCreated(created);
    } catch (err: any) {
      setError(err.message || "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page-center-wrap">
        <div className="feature-card form-card">
          <h2 className="section-title">Create Tournament</h2>
          <p className="section-subtitle">Fill in tournament details based on your backend schema.</p>

          <form onSubmit={handleSubmit} className="create-form">
            <label className="form-label-custom">Tournament Name</label>
            <input
              className="form-input-custom"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spring Championship"
              required
            />

            <label className="form-label-custom">Description</label>
            <textarea
              className="form-input-custom form-textarea-custom"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tournament details and rules"
              required
            />

            <label className="form-label-custom">Bracket Size (fixed)</label>
            <input
              className="form-input-custom"
              type="number"
              min={6}
              max={6}
              value={bracketSize}
              readOnly
              disabled
              required
            />
            <small className="muted-text">
              This tournament format is restricted to exactly 6 players.
            </small>

            <label className="form-label-custom">Status</label>
            <select
              className="form-input-custom"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>

            {error && <div className="inline-error">{error}</div>}

            <div className="form-actions-row">
              <button type="button" className="secondary-btn" onClick={onCancel}>
                Back
              </button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? "Creating..." : "Create Tournament"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateTournamentForm;
