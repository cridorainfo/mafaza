SELECT
  (SELECT COUNT(*) FROM "Users") AS users,
  (SELECT COUNT(*) FROM "UserLedgers") AS ledgers,
  (SELECT COUNT(*) FROM "ProjectImages") AS images,
  (SELECT COUNT(*) FROM "Projects") AS projects;
SELECT id, "UserId", "ProjectId", investment, returns FROM "UserLedgers";
SELECT id, link, "ProjectId" FROM "ProjectImages";
