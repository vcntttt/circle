import 'dotenv/config';
import { db, pool, schema } from '../lib/db';
import { projects as mockProjects } from '../mock-data/projects';

const toSlug = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

async function main() {
   if (!db || !pool) {
      throw new Error('DATABASE_URL is required before running the seed script.');
   }

   const seedProjects = mockProjects.map((project) => ({
      name: project.name,
      slug: toSlug(project.name),
      description: `Seeded from the original Circle mock dataset for ${project.name}.`,
      status: project.status.id,
   }));

   const insertedProjects = await db
      .insert(schema.projects)
      .values(seedProjects)
      .onConflictDoNothing({ target: schema.projects.slug })
      .returning({ id: schema.projects.id });

   console.log(`Inserted ${insertedProjects.length} projects.`);
}

main()
   .catch((error) => {
      console.error('Failed to seed database.', error);
      process.exitCode = 1;
   })
   .finally(async () => {
      await pool?.end();
   });
