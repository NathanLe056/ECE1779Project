// methods for running SQL queries related to brackets

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
    * Creates a new bracket in the database and returns the generated ID
    * @param {string} bracketData.title - The title of the bracket
    * @param {string} bracketData.description - The description of the bracket
    * @returns {Promise<string>} - A promise that resolves to the ID of the newly created bracket
*/
async function createBracket({title, description}){
    const id = uuidv4();

    const query = 
    `
    INSERT INTO BRACKETS (id, title, description)
    VALUES ($1, $2, $3)
    `;
    const values = [id, title, description];

    try{
        await pool.query(query, values);
        return id;
    } catch (err){
        console.error("Error creating bracket:", err);
        throw err;
    }
}

/*
    * Retrieves a bracket by its ID
    * @param {string} id - The ID of the bracket to retrieve
    * @returns {Promise<Object>} - A promise that resolves to an object containing the bracket's details
*/
async function getBracketById(id) {
    const bracket_query = 
    `
    SELECT * FROM BRACKETS WHERE id = $1
    `;
    const bracket_values = [id];

    try{
        const bracket_result = await pool.query(bracket_query, bracket_values);

        return bracket_result.rows.length > 0 ? bracket_result.rows[0] : null;
    } catch (err){
        console.error("Error fetching bracket info:", err);
        throw err;
    }
}


module.exports = {
    createBracket,
    getBracketById,
};

