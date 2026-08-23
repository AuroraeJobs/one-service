// 用法：
// mongosh "mongodb://localhost:27017/test" one-record/scripts/set-all-salary-record-types.js

const databaseName = db.getName();

if (["admin", "config", "local"].includes(databaseName)) {
  throw new Error(`拒绝在 MongoDB 系统数据库 ${databaseName} 中执行`);
}

const salaryRecords = db.getCollection("salary_records");
const totalCount = salaryRecords.countDocuments({});
const pendingCount = salaryRecords.countDocuments({ recordType: { $ne: "SALARY" } });

print(`数据库: ${databaseName}`);
print(`工资记录总数: ${totalCount}`);
print(`待更新记录数: ${pendingCount}`);

if (pendingCount === 0) {
  print("所有记录已经是 SALARY，无需更新。");
} else {
  const result = salaryRecords.updateMany(
    { recordType: { $ne: "SALARY" } },
    { $set: { recordType: "SALARY" } }
  );

  const remainingCount = salaryRecords.countDocuments({ recordType: { $ne: "SALARY" } });

  print(`匹配记录数: ${result.matchedCount}`);
  print(`实际更新数: ${result.modifiedCount}`);
  print(`更新后非 SALARY 记录数: ${remainingCount}`);

  if (remainingCount !== 0) {
    throw new Error("仍存在未更新为 SALARY 的工资记录");
  }

  print("更新完成：当前所有工资记录类型均为 SALARY。");
}
