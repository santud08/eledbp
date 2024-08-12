import { Router } from "express";
import { authRouter } from "./auth.js";
import { titleRouter } from "./titles.js";
import { siteRouter } from "./site.js";
import { searchRouter } from "./search.js";
import { languageRouter } from "./language.js";
import { userRouter } from "./user.js";
import { mediaRouter } from "./media.js";
import { tagRouter } from "./tag.js";
import { communityRouter } from "./community.js";
import { seasonRouter } from "./season.js";
import path from "path";
import fs from "fs";
import { peopleRouter } from "./people.js";
import { listRouter } from "./list.js";
import { homeRouter } from "./homepage.js";
import { elasticRouter } from "./elasticSearch.js";
import { myPageRouter } from "./myPage.js";
import { webtoonsRouter } from "./webtoons.js";
import { awardsRouter } from "./awards.js";
import { movieRouter } from "./movie.js";
import { tvRouter } from "./tv.js";
import { analyticsRouter } from "./analytics.js";

const v1SiteRouter = Router();

// All auth routes will go here
v1SiteRouter.use("/", siteRouter);
v1SiteRouter.use("/auth", authRouter);
v1SiteRouter.use("/title", [titleRouter, movieRouter, tvRouter, webtoonsRouter]);
v1SiteRouter.use("/user", userRouter);
v1SiteRouter.use("/search", searchRouter);
v1SiteRouter.use("/community", communityRouter);
v1SiteRouter.use("/language", languageRouter);
v1SiteRouter.use("/media", mediaRouter);
v1SiteRouter.use("/tag", tagRouter);
v1SiteRouter.use("/season", seasonRouter);
v1SiteRouter.use("/people", peopleRouter);
v1SiteRouter.use("/list", listRouter);
v1SiteRouter.use("/home", homeRouter);
v1SiteRouter.use("/elastic-search", elasticRouter);
v1SiteRouter.use("/mypage", myPageRouter);
v1SiteRouter.use("/awards", awardsRouter);
v1SiteRouter.use("/analytics", analyticsRouter);

//start used for testing purpose
v1SiteRouter.get("/image/logo", (req, res) => {
  res.sendFile(path.resolve("src/assets/images/logo", "logo.png"));
});

v1SiteRouter.get("/public/images/ott/:image", (req, res) => {
  const imageName = req.params.image ? req.params.image : "";
  if (imageName) {
    if (fs.existsSync(path.resolve("src/assets/images/ott", `${imageName}`)))
      res.sendFile(path.resolve("src/assets/images/ott", `${imageName}`));
    else res.sendFile(path.resolve("src/assets/images/ott", ""));
  } else res.sendFile(path.resolve("src/assets/images/ott", ""));
});

v1SiteRouter.get("/public/images/network/:image", (req, res) => {
  const imageName = req.params.image ? req.params.image : "";
  if (imageName) {
    if (fs.existsSync(path.resolve("src/assets/images/network", `${imageName}`)))
      res.sendFile(path.resolve("src/assets/images/network", `${imageName}`));
    else res.sendFile(path.resolve("src/assets/images/network", ""));
  } else res.sendFile(path.resolve("src/assets/images/network", ""));
});

v1SiteRouter.get("/public/images/:image", (req, res) => {
  const imageName = req.params.image ? req.params.image : "";
  if (imageName) {
    if (fs.existsSync(path.resolve("src/assets/images", `${imageName}`)))
      res.sendFile(path.resolve("src/assets/images", `${imageName}`));
    else res.sendFile(path.resolve("src/assets/images", "noi.jpg"));
  } else res.sendFile(path.resolve("src/assets/images", "noi.jpg"));
});

v1SiteRouter.get("/public/images/wt-channel/:image", (req, res) => {
  const imageName = req.params.image ? req.params.image : "";
  if (imageName) {
    if (fs.existsSync(path.resolve("src/assets/images/wt-channel", `${imageName}`)))
      res.sendFile(path.resolve("src/assets/images/wt-channel", `${imageName}`));
    else res.sendFile(path.resolve("src/assets/images/wt-channel", ""));
  } else res.sendFile(path.resolve("src/assets/images/wt-channel", ""));
});

//end used for testing purpose
export { v1SiteRouter };
