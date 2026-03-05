/*
    * Represents a tournament match.
    @ constructor
    * @param {string} id - The unique identifier for the match
    * @param {string} bracket_id - The ID of the bracket to which the match belongs
    * @param {number} round_number - The round number of the match
    * @param {number} match_number - The match number within the round
    * @param {string} participant1_id - The ID of the first participant
    * @param {string} participant2_id - The ID of the second participant
    * @param {string|null} winner_id - The ID of the winning participant (null if not completed)
*/
class Match {
    constructor(id, bracket_id, round_number, match_number, participant1_id, participant2_id, winner_id = null) {
        this.id = id;
        this.bracket_id = bracket_id;
        this.round_number = round_number;
        this.match_number = match_number;
        this.participant1_id = participant1_id;
        this.participant2_id = participant2_id;
        this.winner_id = winner_id;
    }

    toJSON() {
        return {
            id: this.id,
            bracket_id: this.bracket_id,
            round_number: this.round_number,
            match_number: this.match_number,
            participant1_id: this.participant1_id,
            participant2_id: this.participant2_id,
            winner_id: this.winner_id,
        }
    }
}

module.exports = Match;