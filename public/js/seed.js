import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './src/lib/prisma.js';

// Demo password shared by every seeded account.
const PASSWORD = 'password123';

const USERS = [
  {
    username: 'alice',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    bio: '📷 Photographer chasing golden hour. Coffee enthusiast.',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  },
  {
    username: 'bob',
    email: 'bob@example.com',
    displayName: 'Bob Smith',
    bio: 'Full-stack developer. I build things and occasionally break them.',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
  },
  {
    username: 'carol',
    email: 'carol@example.com',
    displayName: 'Carol Lee',
    bio: 'Product designer · Minimalist · Plant parent 🌿',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
  },
  {
    username: 'dave',
    email: 'dave@example.com',
    displayName: 'Dave Patel',
    bio: 'Traveler & foodie. 27 countries and counting ✈️',
    avatarUrl: 'https://i.pravatar.cc/150?img=33',
  },
];

// Who follows whom (by username).
const FOLLOWS = [
  ['alice', 'bob'],
  ['alice', 'carol'],
  ['alice', 'dave'],
  ['bob', 'alice'],
  ['bob', 'dave'],
  ['carol', 'alice'],
  ['carol', 'bob'],
  ['dave', 'alice'],
  ['dave', 'carol'],
];

// Posts in chronological order (oldest first). `minutesAgo` controls createdAt.
const POSTS = [
  { author: 'alice', minutesAgo: 600, content: 'Just got back from a sunrise shoot at the coast. The light was unreal today. 🌅', imageUrl: 'https://picsum.photos/seed/sunrise/700/450' },
  { author: 'bob', minutesAgo: 540, content: 'Shipped a new feature today using Express + Prisma. SQLite is honestly underrated for small apps.' },
  { author: 'carol', minutesAgo: 480, content: 'Redesigned my portfolio over the weekend. Less is more — removed half the elements and it finally breathes.', imageUrl: 'https://picsum.photos/seed/design/700/450' },
  { author: 'dave', minutesAgo: 420, content: 'Street food tour in the old town was incredible. Ate things I cannot pronounce and loved every bite. 🍜' },
  { author: 'alice', minutesAgo: 300, content: 'Editing photos with a fresh cup of coffee. Best part of the creative process honestly.' },
  { author: 'bob', minutesAgo: 240, content: 'Hot take: writing tests first actually makes me faster, not slower. Fight me in the comments.' },
  { author: 'carol', minutesAgo: 150, content: 'New plant friend joined the family today. Say hi to Fernando the fern. 🌿' },
  { author: 'dave', minutesAgo: 90, content: 'Booked my next trip! Any recommendations for hidden gems off the tourist trail?' },
  { author: 'alice', minutesAgo: 45, content: 'Golden hour from the rooftop tonight. Sometimes you do not even need to leave home.', imageUrl: 'https://picsum.photos/seed/rooftop/700/450' },
];

// Comments: [postIndex, author, content]
const COMMENTS = [
  [0, 'bob', 'These colors are stunning! What camera do you shoot with?'],
  [0, 'carol', 'Wow, framing this one. 😍'],
  [0, 'dave', 'Okay this is my new wallpaper.'],
  [1, 'carol', 'Prisma has been great for me too. The type-safety is chef’s kiss.'],
  [1, 'alice', 'Teach me your ways 🙏'],
  [2, 'alice', 'The negative space is perfect. Clean!'],
  [3, 'alice', 'Now I am hungry. Send the address.'],
  [5, 'carol', 'Tests-first gang rise up. 🙌'],
  [6, 'dave', 'Fernando is thriving. Great name.'],
  [7, 'bob', 'Go somewhere with bad wifi and good mountains.'],
];

// Likes: [postIndex, username]
const LIKES = [
  [0, 'bob'], [0, 'carol'], [0, 'dave'],
  [1, 'alice'], [1, 'carol'],
  [2, 'alice'], [2, 'dave'],
  [3, 'alice'], [3, 'bob'],
  [4, 'carol'],
  [5, 'carol'], [5, 'dave'],
  [6, 'alice'], [6, 'bob'], [6, 'dave'],
  [7, 'alice'],
  [8, 'bob'], [8, 'carol'], [8, 'dave'],
];

function minutesAgoToDate(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean slate (order matters because of FKs; cascade would handle it too).
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Users
  const usersByName = {};
  for (const u of USERS) {
    const user = await prisma.user.create({ data: { ...u, passwordHash } });
    usersByName[u.username] = user;
  }
  console.log(`  • ${Object.keys(usersByName).length} users`);

  // Follows
  for (const [follower, following] of FOLLOWS) {
    await prisma.follow.create({
      data: { followerId: usersByName[follower].id, followingId: usersByName[following].id },
    });
  }
  console.log(`  • ${FOLLOWS.length} follow relationships`);

  // Posts
  const postIds = [];
  for (const p of POSTS) {
    const post = await prisma.post.create({
      data: {
        authorId: usersByName[p.author].id,
        content: p.content,
        imageUrl: p.imageUrl ?? null,
        createdAt: minutesAgoToDate(p.minutesAgo),
      },
    });
    postIds.push(post.id);
  }
  console.log(`  • ${postIds.length} posts`);

  // Comments
  for (const [idx, author, content] of COMMENTS) {
    await prisma.comment.create({
      data: { postId: postIds[idx], authorId: usersByName[author].id, content },
    });
  }
  console.log(`  • ${COMMENTS.length} comments`);

  // Likes
  for (const [idx, username] of LIKES) {
    await prisma.like.create({
      data: { postId: postIds[idx], userId: usersByName[username].id },
    });
  }
  console.log(`  • ${LIKES.length} likes`);

  console.log('\n✅ Seed complete. Demo accounts (password: "password123"):');
  for (const u of USERS) console.log(`   - ${u.username} / ${u.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
