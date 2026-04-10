import { PrismaClient } from "@prisma/client";

const COACHES_POLL: { rank: number; name: string }[] = [
  { rank: 1, name: "UCLA" }, { rank: 2, name: "Hawai'i" },
  { rank: 3, name: "Long Beach State" }, { rank: 4, name: "USC" },
  { rank: 5, name: "UC Irvine" }, { rank: 6, name: "Pepperdine" },
  { rank: 7, name: "Ball State" }, { rank: 8, name: "UCSB" },
  { rank: 9, name: "Loyola" }, { rank: 10, name: "BYU" },
  { rank: 11, name: "Lindenwood" }, { rank: 12, name: "McKendree" },
  { rank: 13, name: "UCSD" }, { rank: 14, name: "Stanford" },
  { rank: 15, name: "Penn State" }, { rank: 16, name: "Lewis" },
  { rank: 16, name: "Ohio State" }, { rank: 18, name: "CSUN" },
  { rank: 19, name: "NJIT" }, { rank: 20, name: "Purdue Fort Wayne" },
];

interface TitleEntry {
  name: string;
  titles: number;
  years: string;
}

const CHAMPIONSHIP_HISTORY: TitleEntry[] = [
  { name: "UCLA", titles: 21, years: "1970,1971,1972,1974,1975,1976,1979,1981,1982,1983,1984,1987,1989,1993,1995,1996,1998,2000,2006,2023,2024" },
  { name: "Pepperdine", titles: 5, years: "1978,1985,1986,1988,1992" },
  { name: "USC", titles: 4, years: "1977,1980,1990,1994" },
  { name: "Long Beach State", titles: 4, years: "1991,2018,2019,2025" },
  { name: "Stanford", titles: 3, years: "1997,2010,2016" },
  { name: "Hawaii", titles: 3, years: "2002,2021,2022" },
  { name: "Ohio State", titles: 3, years: "2011,2016,2017" },
  { name: "Loyola Chicago", titles: 2, years: "2014,2015" },
  { name: "UC Irvine", titles: 2, years: "2007,2012,2013" },
  { name: "Penn State", titles: 2, years: "2008,2009" },
  { name: "BYU", titles: 2, years: "1999,2001,2004" },
  { name: "Lewis", titles: 1, years: "2003" },
  { name: "UCSD", titles: 1, years: "2005" },
];

const NAME_ALIASES: Record<string, string> = {
  "long beach state": "long beach st.",
  "ball state": "ball st.",
  "ucsb": "uc santa barbara",
  "ucsd": "uc san diego",
  "penn state": "penn st.",
  "ohio state": "ohio st.",
  "usc": "southern california",
};

function normalize(name: string): string {
  return name.toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyMatch(pollName: string, dbName: string): boolean {
  const a = normalize(pollName);
  const b = normalize(dbName);
  if (a === b) return true;
  if (b.includes(a) || a.includes(b)) return true;
  const alias = NAME_ALIASES[a];
  if (alias && normalize(dbName) === alias) return true;
  return false;
}

export async function applyRankings(prisma: PrismaClient): Promise<void> {
  const teams = await prisma.team.findMany({ select: { id: true, name: true } });

  await prisma.team.updateMany({ data: { coachesPollRank: null } });

  for (const entry of COACHES_POLL) {
    const match = teams.find((t) => fuzzyMatch(entry.name, t.name));
    if (match) {
      await prisma.team.update({ where: { id: match.id }, data: { coachesPollRank: entry.rank } });
    } else {
      console.warn(`  Warning: No match for ranked team "${entry.name}"`);
    }
  }
}

export async function applyChampionshipHistory(prisma: PrismaClient): Promise<void> {
  const teams = await prisma.team.findMany({ select: { id: true, name: true } });

  for (const entry of CHAMPIONSHIP_HISTORY) {
    const match = teams.find((t) => fuzzyMatch(entry.name, t.name));
    if (match) {
      await prisma.team.update({
        where: { id: match.id },
        data: { nationalTitles: entry.titles, titleYears: entry.years },
      });
    } else {
      console.warn(`  Warning: No match for championship team "${entry.name}"`);
    }
  }
}
