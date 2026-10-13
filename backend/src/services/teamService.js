// Business logic and SQL execution for Team Members.

function rowToTeamMember(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

function createTeamService(db) {
  const listStmt = db.prepare('SELECT * FROM team_members ORDER BY name ASC');
  const getByIdStmt = db.prepare('SELECT * FROM team_members WHERE id = ?');

  return {
    list() {
      return listStmt.all().map(rowToTeamMember);
    },
    get(id) {
      return rowToTeamMember(getByIdStmt.get(id));
    },
  };
}

module.exports = { createTeamService, rowToTeamMember };
