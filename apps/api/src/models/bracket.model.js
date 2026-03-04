/*
    * Represents a tournament bracket.
    @ constructor
    * @param {string} id - The unique identifier for the bracket
    * @param {string} title - The title of the bracket
    * @param {string} description - A description of the bracket
    * @param {Array} participants - An array of participants in the bracket
    * @param {Array} matches - An array of matches in the bracket
*/
class Bracket{
    constructor(id, title, description, participants = [], matches = []) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.participants = participants;
        this.matches = matches;
    }

    toJSON(){
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            participants: this.participants,
            matches: this.matches,
        }
    }
}

module.exports = Bracket;