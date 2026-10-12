/**
 * Adapter propio Auth.js v5 sobre postgres.js (§5). Sin Prisma/Drizzle.
 * Tablas: users, accounts, sessions, verification_tokens (migración init).
 */
import type {
  Adapter,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";
import { first, getSql, one } from "@/db/client";

type Row = Record<string, unknown>;

function toUser(row: Row): AdapterUser {
  return {
    id: String(row.id),
    name: (row.name as string | null) ?? null,
    email: String(row.email),
    emailVerified: row.email_verified
      ? new Date(row.email_verified as string)
      : null,
    image: (row.image as string | null) ?? null,
  };
}

export function CustomPostgresAdapter(): Adapter {
  const sql = getSql();
  return {
    async createUser(data) {
      const row = one(
        (await sql`insert into users (name, email, email_verified, image)
          values (${data.name ?? null}, ${data.email}, ${(data.emailVerified as Date | null) ?? null}, ${data.image ?? null})
          returning *`) as Row[],
        "Usuario",
      );
      return toUser(row);
    },
    async getUser(id) {
      const row = first(
        (await sql`select * from users where id = ${id}`) as Row[],
      );
      return row ? toUser(row) : null;
    },
    async getUserByEmail(email) {
      const row = first(
        (await sql`select * from users where email = ${email}`) as Row[],
      );
      return row ? toUser(row) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const row = first(
        (await sql`select u.* from users u
          join accounts a on a.user_id = u.id
          where a.provider = ${provider} and a.provider_account_id = ${providerAccountId}`) as Row[],
      );
      return row ? toUser(row) : null;
    },
    async updateUser(data) {
      const row = one(
        (await sql`update users set
            name = ${data.name ?? null},
            email = ${data.email as string},
            email_verified = ${(data.emailVerified as Date | null) ?? null},
            image = ${data.image ?? null}
          where id = ${data.id as string} returning *`) as Row[],
        "Usuario",
      );
      return toUser(row);
    },
    async deleteUser(id) {
      await sql`delete from users where id = ${id}`;
    },
    async linkAccount(data) {
      await sql`insert into accounts
        (user_id, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
        values (${data.userId}, ${data.provider}, ${data.providerAccountId},
          ${data.refresh_token ?? null}, ${data.access_token ?? null}, ${data.expires_at ?? null},
          ${(data.token_type as string | null) ?? null}, ${data.scope ?? null},
          ${data.id_token ?? null}, ${(data.session_state as string | null) ?? null})
        on conflict (user_id, provider) do update set
          refresh_token = excluded.refresh_token, access_token = excluded.access_token,
          expires_at = excluded.expires_at, id_token = excluded.id_token`;
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await sql`delete from accounts using users
        where accounts.user_id = users.id and accounts.provider = ${provider}
          and accounts.provider_account_id = ${providerAccountId}`;
    },
    async createSession(data) {
      await sql`insert into sessions (session_token, user_id, expires)
        values (${data.sessionToken}, ${data.userId}, ${data.expires as Date})`;
      return {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: data.expires,
      };
    },
    async getSessionAndUser(sessionToken) {
      const row = first(
        (await sql`select s.session_token, s.user_id, s.expires,
            u.id as uid, u.name, u.email, u.email_verified, u.image
          from sessions s join users u on u.id = s.user_id
          where s.session_token = ${sessionToken}`) as Row[],
      );
      if (!row) return null;
      const session: AdapterSession = {
        sessionToken: String(row.session_token),
        userId: String(row.user_id),
        expires: new Date(row.expires as string),
      };
      const user: AdapterUser = {
        id: String(row.uid),
        name: (row.name as string | null) ?? null,
        email: String(row.email),
        emailVerified: row.email_verified
          ? new Date(row.email_verified as string)
          : null,
        image: (row.image as string | null) ?? null,
      };
      return { session, user: user };
    },
    async updateSession(data) {
      const row = first(
        (await sql`update sessions set expires = ${data.expires as Date}
          where session_token = ${data.sessionToken}
          returning session_token, user_id, expires`) as Row[],
      );
      if (!row) return null;
      return {
        sessionToken: String(row.session_token),
        userId: String(row.user_id),
        expires: new Date(row.expires as string),
      };
    },
    async deleteSession(sessionToken) {
      await sql`delete from sessions where session_token = ${sessionToken}`;
    },
    async createVerificationToken(data: VerificationToken) {
      await sql`insert into verification_tokens (identifier, token, expires)
        values (${data.identifier}, ${data.token}, ${data.expires as Date})`;
      return data;
    },
    async useVerificationToken({ identifier, token }) {
      const row = first(
        (await sql`delete from verification_tokens
          where identifier = ${identifier} and token = ${token}
          returning identifier, token, expires`) as Row[],
      );
      if (!row) return null;
      return {
        identifier: String(row.identifier),
        token: String(row.token),
        expires: new Date(row.expires as string),
      };
    },
  };
}
