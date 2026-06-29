import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DATABASE_HOST || 'mysql-1ff48a92-itoy2724-d356.d.aivencloud.com',
      user:     process.env.DATABASE_USER || 'avnadmin',
      password: process.env.DATABASE_PASSWORD || 'AVNS_00WbvIaMHC0gqEbkojK',
      database: process.env.DATABASE_NAME || 'defaultdb',
      port:     Number(process.env.DATABASE_PORT) || 18217,
      ssl: process.env.DATABASE_SSL_CA
        ? { ca: process.env.DATABASE_SSL_CA }
        : { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export default { getPool, query };
