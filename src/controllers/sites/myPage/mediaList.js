import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { paginationService } from "../../../services/index.js";
import { Op, fn, col } from "sequelize";

/**
 * mediaList
 * @param req
 * @param res
 */
export const mediaList = async (req, res, next) => {
  try {
    const myPageUserId = req.userDetails.userId;
    // check for user existance in user table
    const isMyPageUserExist = await model.user.findOne({
      where: { id: myPageUserId, status: "active" },
    });
    if (!isMyPageUserExist) throw StatusError.badRequest(res.__("user is not registered"));

    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const listType = reqBody.list_type;
    const isFirst = reqBody.is_first;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "created_at",
      sortOrder: "DESC",
    };

    let resultData = [];
    let resultList = [];
    //1. listType = video  - all the relation from title / people
    //2. listType = image  - all the relation from title / people
    //3. listType = poster  - all the relation from title / people

    if (listType == "video") {
      const attributes = [
        "primary_id",
        "type",
        "item_id",
        "name",
        "link",
        // [fn("REPLACE", col("videoListView.link"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "link"],
        "user_id",
        "created_at",
      ];
      const includeQuery = [];
      const condition = {
        user_id: myPageUserId,
      };
      // calling pagination service
      resultData = await paginationService.pagination(
        searchParams,
        model.videoListView,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData) {
        for (const eachRow of resultData.rows) {
          if (eachRow) {
            const videoRecord = {
              id: eachRow.primary_id,
              item_id: eachRow.item_id,
              title_name: eachRow.name,
              image_link: eachRow.link,
              type: eachRow.type,
            };
            resultList.push(videoRecord);
          }
        }
      }
    }
    if (listType == "image") {
      const attributes = [
        "primary_id",
        "type",
        "item_id",
        "file_name",
        "original_name",
        [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        "image_category",
        "user_id",
        "created_at",
      ];
      const includeQuery = [];
      const condition = {
        user_id: myPageUserId,
        image_category: { [Op.ne]: "poster_image" },
      };
      // calling pagination service
      resultData = await paginationService.pagination(
        searchParams,
        model.imageListView,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData) {
        for (const eachRow of resultData.rows) {
          if (eachRow) {
            const imageRecord = {
              id: eachRow.primary_id,
              item_id: eachRow.item_id,
              title_name: eachRow.file_name,
              image_link: eachRow.path,
              type: eachRow.type,
            };
            resultList.push(imageRecord);
          }
        }
      }
    }
    if (listType == "poster") {
      const attributes = [
        "primary_id",
        "type",
        "item_id",
        "file_name",
        "original_name",
        [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        "image_category",
        "user_id",
        "created_at",
      ];
      const includeQuery = [];
      const condition = {
        user_id: myPageUserId,
        image_category: "poster_image",
      };
      // calling pagination service
      resultData = await paginationService.pagination(
        searchParams,
        model.imageListView,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData) {
        for (let eachRow of resultData.rows) {
          if (eachRow) {
            const imageRecord = {
              id: eachRow.primary_id,
              item_id: eachRow.item_id,
              title_name: eachRow.file_name,
              image_link: eachRow.path,
              type: eachRow.type,
            };
            resultList.push(imageRecord);
          }
        }
      }
    }

    if (isFirst == "y") {
      const [videoCount, imageCount, posterCount] = await Promise.all([
        model.videoListView.count({
          where: {
            user_id: myPageUserId,
          },
          distinct: false,
          col: "videoListView.primary_id",
        }),
        model.imageListView.count({
          where: {
            user_id: myPageUserId,
            image_category: { [Op.ne]: "poster_image" },
          },
          distinct: false,
          col: "imageListView.primary_id",
        }),
        model.imageListView.count({
          where: {
            user_id: myPageUserId,
            image_category: "poster_image",
          },
          distinct: false,
          col: "imageListView.primary_id",
        }),
      ]);

      res.ok({
        page: page,
        limit: limit,
        total_records: resultData.count,
        total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
        list_type: listType,
        tabs: {
          video: videoCount,
          image: imageCount,
          poster: posterCount,
        },
        results: resultList,
      });
    } else {
      res.ok({
        page: page,
        limit: limit,
        total_records: resultData.count,
        total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
        list_type: listType,
        results: resultList,
      });
    }
  } catch (error) {
    next(error);
  }
};
