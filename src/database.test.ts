import { PrismaClient } from '@prisma/client';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { insertNewClanStats } from './database';

describe('insertNewClanStats', () => {
  let oldEnv: string;
  let replSet: MongoMemoryReplSet;
  beforeEach(async () => {
    replSet = await MongoMemoryReplSet.create({
      binary: { version: '5.2.0' },
      replSet: { count: 1 },
      instanceOpts: [{ storageEngine: 'wiredTiger' }],
    });
    oldEnv = process.env.DATABASE_URL!;
    process.env.DATABASE_URL = replSet.getUri().replace('?', 'codewars?');
  });
  afterEach(() => {
    process.env.DATABASE_URL = oldEnv;
    oldEnv = '';
    // waiting for the promise here will cause the test to hang
    replSet.stop({ doCleanup: true, force: true });
  });

  const USER_IN = {
    username: 'user1',
    rank: '8 kyu',
    clan: '',
  };

  const USER_OUT = {
    username: 'user1',
    rank: -8,
  };

  it('connecting to memory database', async () => {
    const prisma = new PrismaClient();
    await prisma.$connect();
    expect(await prisma.clanMemberChanges.count()).toBe(0);
    return prisma.$disconnect();
  });

  it('inserting adds new stats', async () => {
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 1 },
      },
      5,
    );
    const prisma = new PrismaClient();
    await prisma.$connect();
    expect(await prisma.clanMemberChanges.findMany()).toEqual([
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(5),
        honor: 1,
      }),
    ]);
    return prisma.$disconnect();
  });

  it('keeps number of records minimized', async () => {
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 1 },
      },
      5,
    );
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 1 },
      },
      10,
    );
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 1 },
      },
      15,
    );
    const prisma = new PrismaClient();
    await prisma.$connect();
    expect(await prisma.clanMemberChanges.findMany()).toEqual([
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(5),
        honor: 1,
      }),
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(15),
        honor: 1,
      }),
    ]);
    return prisma.$disconnect();
  });

  it('adds new records as honor changes', async () => {
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 1 },
      },
      5,
    );
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 2 },
      },
      10,
    );
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 2 },
      },
      15,
    );
    const prisma = new PrismaClient();
    await prisma.$connect();
    expect(await prisma.clanMemberChanges.findMany()).toEqual([
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(5),
        honor: 1,
      }),
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(10),
        honor: 2,
      }),
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(15),
        honor: 2,
      }),
    ]);
    return prisma.$disconnect();
  });
  it('keeps new records minimized', async () => {
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 1 },
      },
      5,
    );
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 2 },
      },
      10,
    );
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 2 },
      },
      15,
    );
    await insertNewClanStats(
      {
        user1: { ...USER_IN, honor: 2 },
      },
      20,
    );
    const prisma = new PrismaClient();
    await prisma.$connect();
    expect(await prisma.clanMemberChanges.findMany()).toEqual([
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(5),
        honor: 1,
      }),
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(10),
        honor: 2,
      }),
      expect.objectContaining({
        ...USER_OUT,
        when: new Date(20),
        honor: 2,
      }),
    ]);
    return prisma.$disconnect();
  });
});
