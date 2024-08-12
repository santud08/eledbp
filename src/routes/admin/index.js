import { Router } from "express";
import { userRouter } from "./user.js";
import { newsRouter } from "./news.js";
import { settingsRouter } from "./settings.js";
import { dictionaryRouter } from "./dictionary.js";
import { bulkWorkRouter } from "./bulkWork.js";
import { priorityRouter } from "./priority.js";
import { editRouter } from "./edit.js";
import { awardsRouter } from "./awards.js";
import { analyticsRouter } from "./analytics.js";

const v1AdminRouter = Router();
// All routes go here
v1AdminRouter.use("/", userRouter);
v1AdminRouter.use("/news", newsRouter);
v1AdminRouter.use("/settings", settingsRouter);
v1AdminRouter.use("/dictionary", dictionaryRouter);
v1AdminRouter.use("/bulk-work", bulkWorkRouter);
v1AdminRouter.use("/priority", priorityRouter);
v1AdminRouter.use("/edit", [editRouter, awardsRouter]);
v1AdminRouter.use("/user", userRouter);
v1AdminRouter.use("/analytics", analyticsRouter);

export { v1AdminRouter };
