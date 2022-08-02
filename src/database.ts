import fs from 'fs';
import path from 'path';
import { ClanMemberChanges, PrismaClient } from '@prisma/client';
import { Entry } from './download-clan-stats';
import { IS_MONGODB } from './constants';
import { rankNameToNumber } from './helpers';

/**
 * Migrate all clan stats from JSON files to database
 * Deletes all existing database data
 */
async function migrateAllClanStats() {
  const clanOutputPath = path.join('clan_output');

  const filenames = await fs.promises.readdir(clanOutputPath);
  if (!filenames.length) return console.error('clan_output is empty');

  let userDocuments: Record<string, { username: string; honor: number; rank: number; when: Date }[]> = {};
  for (const [i, filename] of filenames.sort().entries()) {
    if (!filename.endsWith('.json')) continue;
    process.stdout.write('\r');
    process.stdout.write(((i / filenames.length) * 100).toFixed(2) + ': ');

    const epoch = +filename.split('.')[0];
    const users = JSON.parse((await fs.promises.readFile(path.join(clanOutputPath, filename))).toString());
    for (const user of users) {
      if (user.honor === null) continue;
      const newChange: Omit<ClanMemberChanges, 'id'> = {
        honor: user.honor,
        rank: rankNameToNumber(user.rank),
        username: user.username,
        when: new Date(epoch),
      };
      if (!(user.username in userDocuments)) userDocuments[user.username] = [];
      const previousTwo = userDocuments[user.username];
      if (
        previousTwo.length < 2 ||
        previousTwo.slice(0, 2).some(change => change.honor !== newChange.honor || change.rank !== newChange.rank)
      ) {
        previousTwo.unshift(newChange);
      } else {
        previousTwo[0].when = newChange.when;
      }
    }
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  console.log('Deleting all previous clan member changes in 2.5 seconds...');

  await new Promise(r => setTimeout(r, 2500));

  console.log(await prisma.clanMemberChanges.deleteMany({}));

  console.log(await prisma.clanMemberChanges.createMany({ data: Object.values(userDocuments).flat() }));
  return prisma.$disconnect();
}


/**
 * Insert new clan stats into database, only works if there is no newer data in the database
 */
export async function insertNewClanStats(stats: Record<string, Entry>, when = Date.now()) {
  const prisma = new PrismaClient();
  await prisma.$connect();

  if (await prisma.clanMemberChanges.count({ where: { when: { gte: new Date(when) } } })) {
    console.error('There is already newer data in the database');
    return prisma.$disconnect();
  }

  const creates: Omit<ClanMemberChanges, 'id'>[] = [];

  const userTotal = Object.keys(stats).length;

  let previousTwoDocuments: Record<string, ClanMemberChanges[]> = {};
  if (IS_MONGODB) {
    // TODO - look into optimizing $slice by moving into the $push operator
    for (const document of (await prisma.clanMemberChanges.aggregateRaw({
      pipeline: [
        // Group documents by username
        {
          $group: {
            _id: '$username',
            results: { $topN: { n: 2, sortBy: { when: -1, username: -1 }, output: '$$ROOT' } },
          },
        },
      ],
      options: {
        allowDiskUse: true,
      },
    })) as any) {
      previousTwoDocuments[document._id] = document.results.map(({ _id, honor, rank, username, when }: any) => ({
        honor, rank, username,
        id: _id.$oid,
        when: new Date(when.$date)
      }));
    }
  }
  for (const [i, user] of Object.values(stats)
    .sort((a, b) => b.honor - a.honor)
    .entries()) {
    process.stdout.write('\r');
    process.stdout.write(((i / userTotal) * 100).toFixed(2) + ': ');

    const newChange: Omit<ClanMemberChanges, 'id'> = {
      honor: user.honor,
      rank: rankNameToNumber(user.rank),
      username: user.username,
      when: new Date(when),
    };

    const previousTwo = IS_MONGODB
      ? previousTwoDocuments[user.username] ?? []
      : await prisma.clanMemberChanges.findMany({
          take: 2,
          orderBy: { when: 'desc' },
          where: {
            username: user.username,
            when: { lte: new Date(when) },
          },
        });
    if (
      previousTwo.length !== 2 ||
      previousTwo.some(({ honor, rank }) => honor !== newChange.honor || rank !== newChange.rank)
    ) {
      process.stdout.write('C');
      creates.push(newChange);
    } else {
      process.stdout.write('U');
      // TODO - simplify into single raw MongoDB aggregation operation
      await prisma.clanMemberChanges.update({
        where: { id: previousTwo[0].id },
        data: { when: new Date(when) },
      });
    }
  }
  console.log();

  if (creates.length) console.log(await prisma.clanMemberChanges.createMany({ data: creates }));
  else console.log('No new data to insert');

  return prisma.$disconnect();
}

if (require.main === module) migrateAllClanStats().catch(console.error);
