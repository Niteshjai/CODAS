import { pool } from './src/db/connection';
import { UserModel } from './src/models/user';

async function run() {
  try {
    const user = await UserModel.findByPhone('9572430531');
    if (!user) {
      console.log('User not found!');
      return;
    }
    const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [user.id]);
    console.log('Deleted user:', res.rowCount, res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
