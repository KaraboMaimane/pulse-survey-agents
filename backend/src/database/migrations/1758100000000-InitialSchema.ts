import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1758100000000 implements MigrationInterface {
  name = 'InitialSchema1758100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('manager', 'member')`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "name" varchar NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_organization_id" ON "users" ("organization_id")`);

    await queryRunner.query(`
      CREATE TABLE "surveys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "title" varchar NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_surveys_organization_id" ON "surveys" ("organization_id")`);

    await queryRunner.query(`CREATE TYPE "question_type_enum" AS ENUM ('rating', 'yes_no')`);
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "survey_id" uuid NOT NULL REFERENCES "surveys"("id") ON DELETE CASCADE,
        "text" varchar NOT NULL,
        "type" "question_type_enum" NOT NULL,
        "order_index" smallint NOT NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_questions_survey_id" ON "questions" ("survey_id")`);

    await queryRunner.query(`
      CREATE TABLE "responses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "survey_id" uuid NOT NULL REFERENCES "surveys"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
        "submitted_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_responses_survey_id" ON "responses" ("survey_id")`);
    await queryRunner.query(`CREATE INDEX "idx_responses_user_id" ON "responses" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_responses_organization_id" ON "responses" ("organization_id")`);

    await queryRunner.query(`
      CREATE TABLE "answers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "response_id" uuid NOT NULL REFERENCES "responses"("id") ON DELETE CASCADE,
        "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
        "rating_value" smallint,
        "yes_no_value" boolean
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_answers_response_id" ON "answers" ("response_id")`);
    await queryRunner.query(`CREATE INDEX "idx_answers_question_id" ON "answers" ("question_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "answers"`);
    await queryRunner.query(`DROP TABLE "responses"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TYPE "question_type_enum"`);
    await queryRunner.query(`DROP TABLE "surveys"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
