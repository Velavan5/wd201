


//To use postgres , You have to start it ,by using :- systemctl start postgresql     !!don't forget
const Sequelize = require("sequelize");

const database = "todo_db";
const username = "postgres";
const password = "post";
const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
  logging: false
});

const connect = async () => {
  return sequelize.authenticate();
}

module.exports = {
  connect,
  sequelize
}