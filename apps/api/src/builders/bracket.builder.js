const Bracket = require('../models/bracket.model');

/* 
 * Helper class to build full bracket objects 
 */
class BracketBuilder {

    /** 
     * Builds a full bracket object with hydrated participant and match information
     * @param {Object} bracket_row - The raw bracket row data from the database
     * @param {Array} participants - The list of participant objects
     * @param {Array} matches - The list of match objects
     * @returns {Bracket} - The fully built bracket object
     */
    static build(bracket_row, participants, matches) {

        const participant_map = new Map(
            participants.map(p => [p.id, p])
        );

        const hydrated_matches = matches.map(match =>({
            ...match,
            participant1: participant_map.get(match.participant1_id) || null,
            participant2: participant_map.get(match.participant2_id) || null,
            winner: participant_map.get(match.winner_id) || null,
        }));

        return new Bracket({
            id: bracket_row.id,
            title: bracket_row.title,
            description: bracket_row.description,
            participants: participants,
            matches: hydrated_matches,
        });

    }
}

module.exports = BracketBuilder;