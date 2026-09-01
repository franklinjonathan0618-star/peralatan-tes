const mysql = require("mysql2/promise");

(async () => {
  const pool = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "peralatan.bekasi2017@gmail.comsproject 2",
  });

  try {
    const [triggers] = await pool.query("SHOW TRIGGERS");
    console.log("Triggers in database:", triggers.map(t => ({
      Trigger: t.Trigger,
      Event: t.Event,
      Table: t.Table,
      Timing: t.Timing,
      Created: t.Created
    })));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
})();
