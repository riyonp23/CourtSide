import { prisma } from "./prisma.js";
let profileCache = null;
const WEIGHTS = {
    winPct: 4.0,
    hittingPct: 2.5,
    killsPerSet: 1.0,
    blocksPerSet: 0.8,
    acesPerSet: 0.6,
    assistsPerSet: 0.4,
    rank: 0.3,
};
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}
async function buildCache() {
    const teams = await prisma.team.findMany({
        include: { players: { include: { seasonStats: true } } },
    });
    const cache = new Map();
    for (const team of teams) {
        const stats = team.players.flatMap((p) => p.seasonStats);
        const count = stats.length || 1;
        const totalGames = team.wins + team.losses;
        cache.set(team.id, {
            id: team.id,
            name: team.name,
            conference: team.conference,
            wins: team.wins,
            losses: team.losses,
            winPct: totalGames > 0 ? team.wins / totalGames : 0,
            avgKillsPerSet: stats.reduce((s, st) => s + st.killsPerSet, 0) / count,
            avgHittingPct: stats.reduce((s, st) => s + st.hittingPct, 0) / count,
            avgAcesPerSet: stats.reduce((s, st) => s + st.acesPerSet, 0) / count,
            avgDigsPerSet: stats.reduce((s, st) => s + st.digsPerSet, 0) / count,
            avgBlocksPerSet: stats.reduce((s, st) => s + st.blocksPerSet, 0) / count,
            avgAssistsPerSet: stats.reduce((s, st) => s + st.assistsPerSet, 0) / count,
            coachesPollRank: team.coachesPollRank ?? 50,
            nationalTitles: team.nationalTitles,
        });
    }
    return cache;
}
async function getCache() {
    if (!profileCache) {
        profileCache = await buildCache();
    }
    return profileCache;
}
export async function refreshCache() {
    profileCache = await buildCache();
}
export async function predictMatchup(teamAId, teamBId) {
    const cache = await getCache();
    const a = cache.get(teamAId);
    const b = cache.get(teamBId);
    if (!a || !b)
        throw new Error("Team not found in cache");
    const diffs = {
        winPct: a.winPct - b.winPct,
        hittingPct: a.avgHittingPct - b.avgHittingPct,
        killsPerSet: a.avgKillsPerSet - b.avgKillsPerSet,
        blocksPerSet: a.avgBlocksPerSet - b.avgBlocksPerSet,
        acesPerSet: a.avgAcesPerSet - b.avgAcesPerSet,
        assistsPerSet: a.avgAssistsPerSet - b.avgAssistsPerSet,
        rank: (b.coachesPollRank - a.coachesPollRank) / 50,
    };
    const z = WEIGHTS.winPct * diffs.winPct +
        WEIGHTS.hittingPct * diffs.hittingPct +
        WEIGHTS.killsPerSet * diffs.killsPerSet +
        WEIGHTS.blocksPerSet * diffs.blocksPerSet +
        WEIGHTS.acesPerSet * diffs.acesPerSet +
        WEIGHTS.assistsPerSet * diffs.assistsPerSet +
        WEIGHTS.rank * diffs.rank;
    const probA = sigmoid(z);
    const probB = 1 - probA;
    const maxProb = Math.max(probA, probB);
    const confidence = maxProb > 0.7 ? "high" : maxProb > 0.6 ? "medium" : "low";
    const keyFactors = generateKeyFactors(a, b, probA);
    const rankA = a.coachesPollRank < 50 ? a.coachesPollRank : null;
    const rankB = b.coachesPollRank < 50 ? b.coachesPollRank : null;
    return {
        teamA: {
            id: a.id,
            name: a.name,
            conference: a.conference,
            record: `${a.wins}-${a.losses}`,
            winProb: Math.round(probA * 1000) / 1000,
            rank: rankA,
        },
        teamB: {
            id: b.id,
            name: b.name,
            conference: b.conference,
            record: `${b.wins}-${b.losses}`,
            winProb: Math.round(probB * 1000) / 1000,
            rank: rankB,
        },
        confidence,
        keyFactors,
    };
}
function generateKeyFactors(a, b, probA) {
    const factors = [];
    const aRecord = `${a.wins}-${a.losses}`;
    const bRecord = `${b.wins}-${b.losses}`;
    if (Math.abs(a.winPct - b.winPct) > 0.1) {
        const better = a.winPct > b.winPct ? a : b;
        const worse = a.winPct > b.winPct ? b : a;
        const bRec = `${better.wins}-${better.losses}`;
        const wRec = `${worse.wins}-${worse.losses}`;
        factors.push(`${better.name} has the stronger overall record (${bRec} vs ${wRec})`);
    }
    else {
        factors.push(`Both teams have similar records (${a.name} ${aRecord}, ${b.name} ${bRecord})`);
    }
    if (Math.abs(a.avgHittingPct - b.avgHittingPct) > 0.01) {
        const better = a.avgHittingPct > b.avgHittingPct ? a : b;
        const worse = a.avgHittingPct > b.avgHittingPct ? b : a;
        factors.push(`${better.name}'s hitting percentage (.${Math.round(better.avgHittingPct * 1000)}) significantly outpaces ${worse.name}'s (.${Math.round(worse.avgHittingPct * 1000)})`);
    }
    const aRanked = a.coachesPollRank < 50;
    const bRanked = b.coachesPollRank < 50;
    if (aRanked && bRanked && a.coachesPollRank <= 10 && b.coachesPollRank <= 10) {
        factors.push(`Both teams are ranked in the top 10, making this a toss-up`);
    }
    else if (aRanked && !bRanked) {
        factors.push(`${a.name} (#${a.coachesPollRank}) has the ranking advantage over unranked ${b.name}`);
    }
    else if (bRanked && !aRanked) {
        factors.push(`${b.name} (#${b.coachesPollRank}) has the ranking advantage over unranked ${a.name}`);
    }
    if (Math.abs(a.avgBlocksPerSet - b.avgBlocksPerSet) > 0.1) {
        const better = a.avgBlocksPerSet > b.avgBlocksPerSet ? a : b;
        factors.push(`${better.name} has a clear edge in blocking (${better.avgBlocksPerSet.toFixed(2)} blocks/set)`);
    }
    return factors.slice(0, 4);
}
export async function generateFeaturedMatchups() {
    const cache = await getCache();
    const teams = Array.from(cache.values());
    const ranked = teams.filter((t) => t.coachesPollRank < 50).sort((a, b) => a.coachesPollRank - b.coachesPollRank);
    const matchupPairs = [];
    const r0 = ranked[0];
    const r1 = ranked[1];
    const r2 = ranked[2];
    const r3 = ranked[3];
    // #1 vs #2
    if (r0 && r1) {
        matchupPairs.push([r0.id, r1.id]);
    }
    // #3 vs #4
    if (r2 && r3) {
        matchupPairs.push([r2.id, r3.id]);
    }
    // #1 vs defending champion (Long Beach State)
    const longBeach = teams.find((t) => t.name.toLowerCase().includes("long beach"));
    if (r0 && longBeach && longBeach.id !== r0.id) {
        matchupPairs.push([r0.id, longBeach.id]);
    }
    // Best MPSF matchup: top 2 from MPSF
    const mpsf = teams
        .filter((t) => t.conference === "MPSFMVB")
        .sort((a, b) => a.coachesPollRank - b.coachesPollRank);
    const mpsf0 = mpsf[0];
    const mpsf1 = mpsf[1];
    if (mpsf0 && mpsf1) {
        const pair = [mpsf0.id, mpsf1.id];
        const isDupe = matchupPairs.some((p) => (p[0] === pair[0] && p[1] === pair[1]) || (p[0] === pair[1] && p[1] === pair[0]));
        if (!isDupe)
            matchupPairs.push(pair);
    }
    // Cinderella: highest-ranked team with fewest national titles vs a blue blood
    const blueBlood = teams.filter((t) => t.nationalTitles >= 3).sort((a, b) => a.coachesPollRank - b.coachesPollRank);
    const topBlueBlood = blueBlood[0];
    const cinderella = ranked.find((t) => t.nationalTitles === 0) ?? ranked.find((t) => t.nationalTitles <= 1);
    if (cinderella && topBlueBlood && cinderella.id !== topBlueBlood.id) {
        const pair = [cinderella.id, topBlueBlood.id];
        const isDupe = matchupPairs.some((p) => (p[0] === pair[0] && p[1] === pair[1]) || (p[0] === pair[1] && p[1] === pair[0]));
        if (!isDupe)
            matchupPairs.push(pair);
    }
    const predictions = await Promise.all(matchupPairs.slice(0, 5).map(([aId, bId]) => predictMatchup(aId, bId)));
    // Sort by how close to 50/50
    predictions.sort((a, b) => {
        const aDiff = Math.abs(a.teamA.winProb - 0.5);
        const bDiff = Math.abs(b.teamA.winProb - 0.5);
        return aDiff - bDiff;
    });
    return predictions.slice(0, 5);
}
