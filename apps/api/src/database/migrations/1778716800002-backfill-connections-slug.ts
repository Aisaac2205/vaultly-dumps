import { MigrationInterface, QueryRunner } from 'typeorm';

interface ConnectionRow {
  id: string;
  name: string;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'connection';
}

export class BackfillConnectionsSlug1778716800002 implements MigrationInterface {
  name = 'BackfillConnectionsSlug1778716800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: ConnectionRow[] = await queryRunner.query(
      `SELECT id, name FROM connections WHERE slug IS NULL ORDER BY "createdAt" ASC`,
    );

    const reserved: Set<string> = new Set();
    const existing: { slug: string }[] = await queryRunner.query(
      `SELECT slug FROM connections WHERE slug IS NOT NULL`,
    );
    for (const row of existing) reserved.add(row.slug);

    for (const row of rows) {
      const base = slugify(row.name);
      let candidate = base;
      let counter = 1;
      while (reserved.has(candidate)) {
        counter += 1;
        candidate = `${base}-${counter}`;
      }
      reserved.add(candidate);
      await queryRunner.query(
        `UPDATE connections SET slug = $1 WHERE id = $2`,
        [candidate, row.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE connections SET slug = NULL`);
  }
}
