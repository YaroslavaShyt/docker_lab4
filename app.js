const express = require("express");
const mysql = require("mysql2");
const { Client } = require("pg");
const os = require("os");
const { error } = require("console");

const app = express();
const port = 5000;

const ipAddress = Object.values(os.networkInterfaces())
  .flat()
  .find((i) => i.family === "IPv4" && !i.internal)?.address;

const mysqlConnection = mysql.createConnection({
  host: "mysql_db",
  user: "root",
  password: "root",
  database: "my_test_db",
});

const pgClient = new Client({
  host: "pg_db",
  user: "postgres",
  password: "root_password",
  database: "my_test_db",
});
mysqlConnection.connect();
pgClient.connect();

app.get("/", async (req, res) => {
  try {
    const mysqlPromise = new Promise((resolve, reject) => {
      mysqlConnection.query("SELECT * FROM my_test_table", (err, results) => {
        console.log("mysql querry running");
        if (err) {
          console.log(err.toString());
          return reject(err);
        }
        console.log(results);
        resolve(results);
      });
    });

    const pgPromise = pgClient.query("SELECT * FROM my_test_table");

    const [mysqlResults, pgResults] = await Promise.all([
      mysqlPromise,
      pgPromise,
    ]);

    mysqlConnection.end();
    pgClient.end();

    res.send(`
      <h1>IP-адреса: ${ipAddress}</h1>
      <h2>Дані з MySQL:</h2>
      <pre>${JSON.stringify(mysqlResults, null, 2)}</pre>
      <h2>Дані з PostgreSQL:</h2>
      <pre>${JSON.stringify(pgResults.rows, null, 2)}</pre>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Щось пішло не так!");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
});
