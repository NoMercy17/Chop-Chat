async function shouldNotify(recipientId, type, pool, eventCount = 1) {
  const { rows } = await pool.query(
    'SELECT enabled, threshold FROM notification_preferences WHERE user_id = $1 AND type = $2',
    [recipientId, type]
  );
  if (!rows.length) return true;
  const { enabled, threshold } = rows[0];
  if (!enabled) return false;
  if (threshold <= 1) return true;
  return eventCount % threshold === 0;
}

async function batchShouldNotify(userIds, type, pool) {
  if (!userIds.length) return {};
  const { rows } = await pool.query(
    'SELECT user_id, enabled FROM notification_preferences WHERE user_id = ANY($1) AND type = $2',
    [userIds, type]
  );
  const prefMap = {};
  for (const row of rows) prefMap[row.user_id] = row.enabled;
  const result = {};
  for (const id of userIds) result[id] = prefMap[id] !== false;
  return result;
}

module.exports = { shouldNotify, batchShouldNotify };
