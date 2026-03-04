// methods for running SQL queries related to matches

const {v4: uuidv4} = require('uuid');
const { Pool } = require("pg");

// DB query pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

/*
    * Creates a new match in the database and returns the generated ID
    * @param {string} matchData.bracket_id - The ID of the bracket to which the match belongs
    * @param {number} matchData.round_number - The round number of the match
    * @param {number} matchData.match_number - The match number within the round
    * @param {string} matchData.participant1_id - The ID of the first participant
    * @param {string} matchData.participant2_id - The ID of the second participant
    * @param {string} matchData.winner_id - The ID of the winner (if applicable)
    * @returns {Promise<string>} - A promise that resolves to the ID of the newly created match
*/
async function createMatch({bracket_id, round_number, match_number, participant1_id, participant2_id, winner_id}){
    const id = uuidv4();

    const query = 
    `
    INSERT INTO MATCHES (id, bracket_id, round_number, match_number, participant1_id, participant2_id, winner_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [id, bracket_id, round_number, match_number, participant1_id, participant2_id, winner_id];

    try{
        await pool.query(query, values);
        return id;
    } catch (err){
        console.error("Error creating match:", err);
        throw err;
    }
}

/*
    * Retrieves a match by its ID in the database
    * @param {string} id - The ID of the match to retrieve
    * @returns {Promise<Object>} - A promise that resolves to an object containing the match's details
*/
async function getMatchById(id) {
    const match_query = 
    `
    SELECT * FROM MATCHES WHERE id = $1
    `;
    const match_values = [id];

    try{
        const match_result = await pool.query(match_query, match_values);

        return match_result.rows.length > 0 ? match_result.rows[0] : null;

    } catch (err){
        console.error("Error fetching match info:", err);
        throw err;
    }
}

/*
    * Retrieves matches for a bracket by the bracket ID
    * @param {string} id - The ID of the bracket to retrieve the matches for
    * @returns {Promise<Array>} - A promise that resolves to an array of match objects
*/
async function getMatchesByBracketId(id){
    const matches_query =
    `
    SELECT * FROM MATCHES WHERE bracket_id = $1
    `;
    const matches_values = [id];

    try{
        const matches_result = await pool.query(matches_query, matches_values);

        return matches_result.rows;
    } catch (err){
        console.error("Error fetching matches for bracket:", err);
        throw err;
    }
}


module.exports = {
    createMatch,
    getMatchById,
    getMatchesByBracketId,
};

