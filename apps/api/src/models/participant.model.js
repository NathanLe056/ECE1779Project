/*
    * Represents a tournament participant.
    @ constructor
    * @param {string} id - The unique identifier for the participant
    * @param {string} bracket_id - The ID of the bracket to which the participant belongs
    * @param {string} name - The name of the participant
*/
class Participant {
    constructor(id, bracket_id, name){
        this.id = id;
        this.bracket_id = bracket_id;
        this.name = name;
    }

    toJSON(){
        return {
            id: this.id,
            bracket_id: this.bracket_id,
            name: this.name,
        }
    }
}

module.exports = Participant;