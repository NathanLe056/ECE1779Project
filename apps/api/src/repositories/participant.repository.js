// methods for running SQL queries related to participants

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
    * Creates a new participant in the database and returns the generated ID
    * @param {string} participantData.bracket_id - The ID of the bracket to which the participant belongs
    * @param {string} participantData.name - The name of the participant
    * @returns {Promise<string>} - A promise that resolves to the ID of the newly created participant
*/
async function createParticipant({bracket_id, name}){
    const id = uuidv4();

    const query = 
    `
    INSERT INTO PARTICIPANTS (id, bracket_id, name)
    VALUES ($1, $2, $3)
    `;
    const values = [id, bracket_id, name];

    try{
        await pool.query(query, values);
        return id;
    } catch (err){
        console.error("Error creating participant:", err);
        throw err;
    }
}

// Retrieves a bracket by its ID, including its participants and matches

/*
    * Retrieves a bracket by its ID, including its participants and matches
    * @param {string} id - The ID of the bracket to retrieve
    * @returns {Promise<Object>} - A promise that resolves to an object containing the bracket's details, participants, and matches
*/
async function getParticipantById(id) {
    const participant_query = 
    `
    SELECT * FROM PARTICIPANTS WHERE id = $1
    `;
    const participant_values = [id];

    try{
        const participant_result = await pool.query(participant_query, participant_values);

        return participant_result.rows[0] || null;
    } catch (err){
        console.error("Error fetching participant info:", err);
        throw err;
    }
}

/*
    * Retrieves participants for a bracket by the bracket ID
    * @param {string} id - The ID of the bracket to retrieve the matches for
    * @returns {Promise<Array>} - A promise that resolves to an array of match objects
*/
async function getParticipantsByBracketId(id){
    const participants_query =
    `
    SELECT * FROM PARTICIPANTS WHERE bracket_id = $1
    `;
    const participants_values = [id];

    try{
        const participants_result = await pool.query(participants_query, participants_values);
        return participants_result.rows;

    } catch (err){
        console.error("Error fetching participants for bracket:", err);
        throw err;
    }
}

module.exports = {
    createParticipant,
    getParticipantById,
    getParticipantsByBracketId,
};

