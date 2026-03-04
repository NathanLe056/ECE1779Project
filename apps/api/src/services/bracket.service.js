const bracketRepo = require('../repositories/bracket.repository');
const matchRepo = require('../repositories/match.repository');
const participantRepo = require('../repositories/participant.repository');
const BracketBuilder = require('../builders/bracket.builder');

/*
* Retrieves a bracket by its ID, including its participants and matches
* @param {string} id - The ID of the bracket to retrieve
* @returns {Promise<Object>} - A promise that resolves to an object containing the bracket's details, participants, and matches
*/
async function getBracket(id) {

    const bracket = await bracketRepo.getBracketById(id);
    const matches = await matchRepo.getMatchesByBracketId(id);
    const participants = await participantRepo.getParticipantsByBracketId(id);

    return BracketBuilder.build(bracket, participants, matches);
}

module.exports = {
    getBracket,
};