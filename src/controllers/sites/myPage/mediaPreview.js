import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Op, fn, col } from "sequelize";

/**
 * mediaPreview
 * @param req
 * @param res
 */
export const mediaPreview = async (req, res, next) => {
  try {
    const myPageUserId = req.userDetails.userId;
    // check for user existance in user table
    const isMyPageUserExist = await model.user.findOne({
      where: { id: myPageUserId, status: "active" },
    });
    if (!isMyPageUserExist) throw StatusError.badRequest(res.__("user is not registered"));

    const reqBody = req.body;
    const listType = reqBody.list_type;
    const id = reqBody.id;
    const itemId = reqBody.item_id;
    const type = reqBody.type;

    const resultObj = {};

    if (type == "title") {
      if (listType == "video") {
        const videoDetails = await model.video.findOne({
          attributes: ["id", "url", "name"],
          where: {
            id: id,
            status: "active",
            title_id: itemId,
            video_for: "title",
          },
        });

        if (videoDetails) {
          resultObj.list_type = listType;
          resultObj.path = videoDetails.url
            ? Buffer.from(`${videoDetails.url}`).toString("hex")
            : "";
        }
      }
      if (listType == "image") {
        const imageDetails = await model.titleImage.findOne({
          attributes: [
            "id",
            "file_name",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          where: {
            id: id,
            status: "active",
            title_id: itemId,
            image_category: { [Op.ne]: "poster_image" },
          },
        });

        if (imageDetails) {
          resultObj.list_type = listType;
          resultObj.path = imageDetails.path
            ? Buffer.from(`${imageDetails.path}`).toString("hex")
            : "";
        }
      }
      if (listType == "poster") {
        const imageDetails = await model.titleImage.findOne({
          attributes: [
            "id",
            "file_name",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          where: {
            id: id,
            status: "active",
            title_id: itemId,
            image_category: "poster_image",
          },
        });

        if (imageDetails) {
          resultObj.list_type = listType;
          resultObj.path = imageDetails.path
            ? Buffer.from(`${imageDetails.path}`).toString("hex")
            : "";
        }
      }
    }
    if (type == "people") {
      if (listType == "video") {
        const videoDetails = await model.video.findOne({
          attributes: ["id", "url", "name"],
          where: {
            id: id,
            status: "active",
            title_id: itemId,
            video_for: "people",
          },
        });

        if (videoDetails) {
          resultObj.list_type = listType;
          resultObj.path = videoDetails.url
            ? Buffer.from(`${videoDetails.url}`).toString("hex")
            : "";
        }
      }
      if (listType == "image") {
        const imageDetails = await model.peopleImages.findOne({
          attributes: [
            "id",
            "file_name",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          where: {
            id: id,
            status: "active",
            people_id: itemId,
            image_category: { [Op.ne]: "poster_image" },
          },
        });

        if (imageDetails) {
          resultObj.list_type = listType;
          resultObj.path = imageDetails.path
            ? Buffer.from(`${imageDetails.path}`).toString("hex")
            : "";
        }
      }
      if (listType == "poster") {
        const imageDetails = await model.peopleImages.findOne({
          attributes: [
            "id",
            "file_name",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          where: {
            id: id,
            status: "active",
            people_id: itemId,
            image_category: "poster_image",
          },
        });

        if (imageDetails) {
          resultObj.list_type = listType;
          resultObj.path = imageDetails.path
            ? Buffer.from(`${imageDetails.path}`).toString("hex")
            : "";
        }
      }
    }
    res.ok(resultObj);
  } catch (error) {
    next(error);
  }
};
