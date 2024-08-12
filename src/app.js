import express from "express";
import bearerToken from "express-bearer-token";
import path, { resolve, dirname } from "path";
import { v1Router, v1AdminRouter } from "./routes/index.js";
import i18n from "i18n";
import swaggerUi from "swagger-ui-express";
import {
  handleError,
  morganConf,
  connect as dbConnect,
  //connectDb1 as dbConnect1,
  StatusSuccess,
} from "./config/index.js";
import { errors } from "celebrate";
import cors from "cors";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { schedulers } from "./controllers/cronJobs/index.js";
import basicAuth from "express-basic-auth";
import { envs } from "./config/index.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initilization of API's documentation.
 * We used Swagger 3.
 */
app.use("/api-docs/assets", express.static(path.join(__dirname, "assets", "swagger")));
const options = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: "./assets/swagger_application.json",
        name: "Application",
      },
    ],
  },
};
app.use(
  "/api-docs",
  basicAuth({
    users: { [envs.SWAGGER_UI_ACCESS.USER]: envs.SWAGGER_UI_ACCESS.PASSWORD },
    challenge: true,
  }),
  swaggerUi.serve,
  swaggerUi.setup(undefined, options),
);
app.use("/public", express.static(path.join(__dirname, "../public")));
/**
 * Initilization of internationalization(i18n)
 * default language english.
 */
i18n.configure({
  locales: ["en", "ko"],
  directory: resolve(__dirname, "./assets/locales"),
});
app.use(i18n.init);

/**
 * Basic header configuartion
 * It is recomanded to update this section, depending on application's needs
 */
app.use(cors());

/**
 * All express middleware goes here
 * parsing request body
 * `bearerToken` = For `Basic Auth` token
 */
app.use(express.json({ extended: false, limit: "100mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(bearerToken());
app.use(StatusSuccess);
/**
 * Logger methods => error, warn, info, debug
 */
app.use(morganConf);

/**
 * Handaling database connection
 */
dbConnect();
//dbConnect1();
/**
 * Initializing APIs base routes
 */
app.use("/api/v1", v1Router);

/**
 * Initializing Admin APIs base routes
 */
app.use("/api/v1/admin", v1AdminRouter);

/**
 * Default Route
 */
app.get("/", (_req, res) => res.send({ message: "Ok" }));

/**
 * 404 Route
 */
app.get("*", (req, res) => res.status(404).send({ message: "Not found!" }));

/**
 * Overriding the express response
 * ok = 200
 * created = 201
 * noData = 204
 * badRequest = 400
 * forbidden = 403
 * severError = 500
 */
app.use(errors());
app.use(handleError);

//cron setup
schedulers();

/**
 * Establish Socket.io Connection
 */
const httpServer = createServer(app);

export default httpServer;
