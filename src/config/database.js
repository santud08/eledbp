import { envs } from "./index.js";
import Sequelize from "sequelize";
//connecting current database
export const sequelize = new Sequelize(envs.db.database, envs.db.username, envs.db.password, {
  host: envs.db.host,
  port: envs.db.port,
  dialect: envs.db.dialect,
  pool: {
    max: 30,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: { multipleStatements: true },
  logging: false,
});
export const connect = () => {
  sequelize
    .authenticate()
    .then(() => {
      console.log(`Connection(${envs.db.dialect}) has been established successfully.`);
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
    });
};

//conect other database for datamigration
export const sequelizeDb1 = new Sequelize(envs.db1.database, envs.db1.username, envs.db1.password, {
  dialect: envs.db1.dialect,
  host: envs.db1.host,
  //localAddress: "localhost",
  //localAddress: envs.db1.host,
  port: envs.db1.port,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    //host: envs.db1.host,
    //socketPath: "/var/run/mysqld/mysqld.sock",
  },
  logging: false,
});
export const connectDb1 = () => {
  sequelizeDb1
    .authenticate()
    .then(() => {
      console.log(`Connection(${envs.db1.dialect}) of DB1 has been established successfully.`);
    })
    .catch((err) => {
      console.error("Unable to connect to the database1:", err);
    });
};
