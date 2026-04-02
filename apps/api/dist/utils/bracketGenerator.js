import { prisma } from "../lib/prisma.js";
export async function generateBracketMatches(tournament_id) {
    try {
        // Get all members sorted by their join order (by id)
        const members = await prisma.tournamentMember.findMany({
            where: { tournament_id },
            orderBy: { id: "asc" },
            include: { user: true },
        });
        if (members.length !== 6) {
            throw new Error("Tournament must have exactly 6 members to generate bracket");
        }
        // Assign members to positions: p1, p2, p3, p4, p5, p6
        const p1 = members[0].user_id;
        const p2 = members[1].user_id;
        const p3 = members[2].user_id;
        const p4 = members[3].user_id;
        const p5 = members[4].user_id;
        const p6 = members[5].user_id;
        // Delete existing matches for this tournament
        await prisma.match.deleteMany({
            where: { tournament_id },
        });
        // Create Round 1 matches: (p3 vs p4) and (p5 vs p6)
        const matches = [];
        // Match 1: p3 vs p4
        const match1 = await prisma.match.create({
            data: {
                tournament_id,
                player1_id: p3,
                player2_id: p4,
                round_number: 1,
                match_order: 1,
                match_status: "pending",
            },
        });
        matches.push(match1);
        // Match 2: p5 vs p6
        const match2 = await prisma.match.create({
            data: {
                tournament_id,
                player1_id: p5,
                player2_id: p6,
                round_number: 1,
                match_order: 2,
                match_status: "pending",
            },
        });
        matches.push(match2);
        // SF1: p1 vs winner of match between p3 and p4 (winner_id will be null initially)
        const sf1 = await prisma.match.create({
            data: {
                tournament_id,
                player1_id: p1,
                player2_id: -1, // Placeholder for winner of match 1
                round_number: 2,
                match_order: 1,
                match_status: "pending",
            },
        });
        matches.push(sf1);
        // SF2: p2 vs winner of match between p5 and p6 (winner_id will be null initially)
        const sf2 = await prisma.match.create({
            data: {
                tournament_id,
                player1_id: p2,
                player2_id: -1, // Placeholder for winner of match 2
                round_number: 2,
                match_order: 2,
                match_status: "pending",
            },
        });
        matches.push(sf2);
        // Final: winner of SF1 vs winner of SF2
        const final = await prisma.match.create({
            data: {
                tournament_id,
                player1_id: -1, // Placeholder for winner of SF1
                player2_id: -1, // Placeholder for winner of SF2
                round_number: 3,
                match_order: 1,
                match_status: "pending",
            },
        });
        matches.push(final);
        return {
            success: true,
            message: `Bracket generated with ${matches.length} matches for tournament ${tournament_id}`,
            matches: matches.length,
        };
    }
    catch (error) {
        console.error("Error generating bracket:", error);
        throw error;
    }
}
