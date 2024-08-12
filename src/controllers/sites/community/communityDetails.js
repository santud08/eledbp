import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Op, fn, col } from "sequelize";

/* *
 * communityDetails
 * @param req
 * @param res
 * @param next
 */

export const communityDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    const communityType = reqBody.community_type;
    const commentableType = reqBody.commentable_type;
    const commentableId = reqBody.commentable_id;
    const seasonId = reqBody.season_id;
    let resultData = [];
    let getInformations = [];

    let includeQuery = [];
    let condition = [];
    let extraCondition = {};
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const language = req.accept_language;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "DESC",
    };

    searchParams.sortOrderObj = [
      ["id", "DESC"],
      ["community_reply", "id", "ASC"],
    ];
    // Check people is exist
    if (commentableType == "people") {
      getInformations = await model.people.findOne({
        attributes: ["id", "gender", "birth_date"],
        where: { id: commentableId, status: "active" },
      });
    }
    // Check title(movie/tv) is exist
    if (commentableType == "title") {
      getInformations = await model.title.findOne({
        attributes: ["id", "type", "record_status"],
        where: { id: commentableId, record_status: "active" },
        include: {
          model: model.titleTranslation,
          attributes: ["title_id", "name", "description", "site_language"],
          left: true,
          where: { status: "active" },
          required: false,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      });
    }

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid commentable id"));

    if (getInformations.type == "tv" && !seasonId && seasonId == "") {
      throw StatusError.badRequest(res.__("Please enter season id"));
    }

    let isWebtoons = false;
    if (getInformations.type == "webtoons") {
      isWebtoons = true;
    }
    // Extra condition for famous line community listing
    if (commentableType == "people" && communityType == "famous_line") {
      extraCondition = {
        model: model.title,
        as: "famouseTitle",
        attributes: ["id", "record_status"],
        left: true,
        where: { record_status: "active" },
        include: [
          {
            model: model.titleTranslation,
            left: true,
            attributes: ["title_id", "name", "site_language"],
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.titleImage,
            attributes: [
              "title_id",
              [
                fn(
                  "REPLACE",
                  col("famouseTitle.titleImages.file_name"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "file_name",
              ],
              "url",
              "path",
              "source",
            ],
            left: true,
            where: {
              image_category: "poster_image",
              is_main_poster: "y",
              status: "active",
              episode_id: null,
              original_name: {
                [Op.ne]: null,
              },
            },
            required: false,
          },
          {
            model: model.creditable,
            attributes: ["people_id", "creditable_id", "character_name"],
            left: true,
            where: { creditable_type: "title", people_id: commentableId, status: "active" },
            required: false,
          },
        ],
        required: false,
      };
    }

    if (commentableType == "title" && communityType == "famous_line") {
      if (isWebtoons) {
        extraCondition = {
          model: model.creditable,
          as: "character",
          attributes: ["id"],
          where: { creditable_id: commentableId, status: "active" },
          include: [
            {
              model: model.creditableTranslation,
              as: "creditableTranslationOne",
              attributes: ["character_name", "character_image", "description"],
              left: true,
              where: {
                status: "active",
                site_language: "en",
              },
              required: false,
            },
            {
              model: model.creditableTranslation,
              as: "creditableTranslationOnel",
              attributes: ["character_name", "character_image", "description"],
              left: true,
              where: {
                status: "active",
                site_language: "ko",
              },
              required: false,
            },
          ],
          required: false,
        };
      } else {
        extraCondition = {
          model: model.people,
          as: "famousePeople",
          left: true,
          attributes: [
            "id",
            "birth_date",
            [
              fn(
                "REPLACE",
                col("famousePeople.poster"),
                `${envs.s3.BUCKET_URL}`,
                `${envs.aws.cdnUrl}`,
              ),
              "poster",
            ],
            "popularity",
          ],
          where: { status: "active" },
          include: [
            {
              model: model.peopleTranslation,
              attributes: ["people_id", "name", "known_for", "site_language"],
              left: true,
              where: { status: "active" },
              required: false,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
            {
              model: model.creditable,
              attributes: ["people_id", "creditable_id", "character_name"],
              left: true,
              where: { creditable_type: "title", creditable_id: commentableId, status: "active" },
              required: false,
            },
          ],
          required: false,
        };
      }
    }

    const attributes = [
      "id",
      "user_id",
      "community_type",
      "commentable_type",
      "content",
      "is_spoiler",
      "parent_id",
      "file_original_name",
      "file_type",
      [
        fn("REPLACE", col("community.file_name"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
        "file_name",
      ],
      "commentable_id",
      "site_language",
      "status",
      "created_at",
      [fn("communityLikeCount", col("community.id")), "number_of_like"],
      [fn("isCommunityLiked", col("community.id"), userId), "is_liked"],
      "character_id",
    ];
    const modelName = model.community;

    includeQuery = [
      {
        model: model.user,
        left: true,
        attributes: [
          "username",
          [fn("CONCAT", col("user.first_name"), " ", col("user.last_name")), "user_name"],
          [
            fn("REPLACE", col("user.avatar"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
            "avatar",
          ],
        ],
        where: { status: "active" },
        required: false,
      },
      {
        model: model.community,
        as: "community_reply",
        left: true,
        attributes: [
          "id",
          "content",
          "is_spoiler",
          "file_original_name",
          "file_type",
          [
            fn(
              "REPLACE",
              col("community_reply.file_name"),
              `${envs.s3.BUCKET_URL}`,
              `${envs.aws.cdnUrl}`,
            ),
            "file_name",
          ],
          "user_id",
          "created_at",
        ],
        where: { status: "active", parent_id: { [Op.ne]: 0 }, commentable_type: commentableType },
        required: false,
        include: {
          model: model.user,
          left: true,
          attributes: [
            "username",
            [
              fn(
                "CONCAT",
                col("community_reply.user.first_name"),
                " ",
                col("community_reply.user.last_name"),
              ),
              "user_name",
            ],
            [
              fn(
                "REPLACE",
                col("community_reply.user.avatar"),
                `${envs.s3.BUCKET_URL}`,
                `${envs.aws.cdnUrl}`,
              ),
              "avatar",
            ],
          ],
          where: { status: "active" },
          required: false,
        },
      },
    ];

    if (communityType == "famous_line") {
      includeQuery.push(extraCondition);
    }

    condition = {
      community_type: communityType,
      status: "active",
      parent_id: "0",
      commentable_id: commentableId,
      commentable_type: commentableType,
    };

    // Add extra conditions for seasonId
    if (seasonId) {
      condition.season_id = seasonId;
    }

    resultData = await paginationService.pagination(
      searchParams,
      modelName,
      includeQuery,
      condition,
      attributes,
    );
    ///  End  ///

    let communityDataList = [];
    if (resultData) {
      for (let eachRow of resultData.rows) {
        let obj = {};
        if (eachRow) {
          // Extra data for famous line community list
          obj.id = eachRow.dataValues.id;

          if (commentableType == "title" && communityType == "famous_line") {
            if (isWebtoons) {
              const characterNameEn =
                eachRow.character &&
                eachRow.character.creditableTranslationOne &&
                eachRow.character.creditableTranslationOne.character_name
                  ? eachRow.character.creditableTranslationOne.character_name
                  : "";
              const characterImageEn =
                eachRow.character &&
                eachRow.character.creditableTranslationOne &&
                eachRow.character.creditableTranslationOne.character_image
                  ? eachRow.character.creditableTranslationOne.character_image
                  : "";
              const characterDescriptionEn =
                eachRow.character &&
                eachRow.character.creditableTranslationOne &&
                eachRow.character.creditableTranslationOne.description
                  ? eachRow.character.creditableTranslationOne.description
                  : "";
              const characterNameKo =
                eachRow.character &&
                eachRow.character.creditableTranslationOnel &&
                eachRow.character.creditableTranslationOnel.character_name
                  ? eachRow.character.creditableTranslationOnel.character_name
                  : "";
              const characterImageKo =
                eachRow.character &&
                eachRow.character.creditableTranslationOnel &&
                eachRow.character.creditableTranslationOnel.character_image
                  ? eachRow.character.creditableTranslationOnel.character_image
                  : "";
              const characterDescriptionKo =
                eachRow.character &&
                eachRow.character.creditableTranslationOnel &&
                eachRow.character.creditableTranslationOnel.description
                  ? eachRow.character.creditableTranslationOnel.description
                  : "";
              if (language == "ko") {
                obj.people_character = characterNameKo ? characterNameKo : characterNameEn;
                obj.people_image = characterImageKo ? characterImageKo : characterImageEn;
                obj.description = characterDescriptionKo
                  ? characterDescriptionKo
                  : characterDescriptionEn;
              }
              if (language == "en") {
                obj.people_character = characterNameEn ? characterNameEn : characterNameKo;
                obj.people_image = characterImageEn ? characterImageEn : characterImageKo;
                obj.description = characterDescriptionEn
                  ? characterDescriptionEn
                  : characterDescriptionKo;
              }

              obj.people_id = "";
              obj.people_name = "";
              obj.title_name =
                getInformations.dataValues.titleTranslations &&
                getInformations.dataValues.titleTranslations.length > 0 &&
                getInformations.dataValues.titleTranslations[0].name
                  ? getInformations.dataValues.titleTranslations[0].name
                  : "";
            } else {
              obj.people_id =
                eachRow.dataValues.famousePeople && eachRow.dataValues.famousePeople.id
                  ? eachRow.dataValues.famousePeople.id
                  : "";
              obj.people_name =
                eachRow.dataValues.famousePeople &&
                eachRow.dataValues.famousePeople.peopleTranslations &&
                eachRow.dataValues.famousePeople.peopleTranslations.length > 0 &&
                eachRow.dataValues.famousePeople.peopleTranslations[0].name
                  ? eachRow.dataValues.famousePeople.peopleTranslations[0].name
                  : "";
              obj.people_image =
                eachRow.dataValues.famousePeople && eachRow.dataValues.famousePeople.poster
                  ? eachRow.dataValues.famousePeople.poster
                  : "";
              obj.people_character =
                eachRow.dataValues.famousePeople &&
                eachRow.dataValues.famousePeople.creditables &&
                eachRow.dataValues.famousePeople.creditables.length > 0 &&
                eachRow.dataValues.famousePeople.creditables[0].character_name
                  ? eachRow.dataValues.famousePeople.creditables[0].character_name
                  : "";
              obj.title_name =
                getInformations.dataValues.titleTranslations &&
                getInformations.dataValues.titleTranslations.length > 0 &&
                getInformations.dataValues.titleTranslations[0].name
                  ? getInformations.dataValues.titleTranslations[0].name
                  : "";
            }
          }

          if (commentableType == "people" && communityType == "famous_line") {
            obj.title_name =
              eachRow.dataValues.famouseTitle &&
              eachRow.dataValues.famouseTitle.titleTranslations &&
              eachRow.dataValues.famouseTitle.titleTranslations.length > 0 &&
              eachRow.dataValues.famouseTitle.titleTranslations[0].name
                ? eachRow.dataValues.famouseTitle.titleTranslations[0].name
                : "";
            obj.title_image =
              eachRow.dataValues.famouseTitle &&
              eachRow.dataValues.famouseTitle.titleImages &&
              eachRow.dataValues.famouseTitle.titleImages.length > 0 &&
              eachRow.dataValues.famouseTitle.titleImages[0].path
                ? eachRow.dataValues.famouseTitle.titleImages[0].path
                : "";
            obj.character_name =
              eachRow.dataValues.famouseTitle &&
              eachRow.dataValues.famouseTitle.creditables &&
              eachRow.dataValues.famouseTitle.creditables.length > 0 &&
              eachRow.dataValues.famouseTitle.creditables[0].character_name
                ? eachRow.dataValues.famouseTitle.creditables[0].character_name
                : "";
          }

          obj.user_name =
            eachRow.dataValues.user && eachRow.dataValues.user.get("user_name")
              ? eachRow.dataValues.user.get("user_name")
              : "";
          obj.user_image =
            eachRow.dataValues.user && eachRow.dataValues.user.avatar
              ? eachRow.dataValues.user.avatar
              : "";
          obj.message_date = eachRow.dataValues.created_at ? eachRow.dataValues.created_at : "";
          obj.is_spoiler = eachRow.dataValues.is_spoiler;
          obj.message = eachRow.dataValues.content;
          obj.attachment_image = eachRow.dataValues.file_name ? eachRow.dataValues.file_name : "";
          obj.number_of_like = eachRow.dataValues.number_of_like
            ? eachRow.dataValues.number_of_like
            : 0;
          obj.is_liked = eachRow.dataValues.is_liked ? eachRow.dataValues.is_liked : "n";

          const communityReply = eachRow.dataValues.community_reply;
          obj.reply = [];
          if (communityReply) {
            for (const eachRow of communityReply) {
              let replyObj = {};
              replyObj.id = eachRow.dataValues.id;
              replyObj.user_name =
                eachRow.dataValues.user && eachRow.dataValues.user.get("user_name")
                  ? eachRow.dataValues.user.get("user_name")
                  : "";
              replyObj.user_image =
                eachRow.dataValues.user && eachRow.dataValues.user.avatar
                  ? eachRow.dataValues.user.avatar
                  : "";
              replyObj.reply_date = eachRow.dataValues.created_at
                ? eachRow.dataValues.created_at
                : "";
              replyObj.is_spoiler = eachRow.dataValues.is_spoiler
                ? eachRow.dataValues.is_spoiler
                : "";
              replyObj.reply_message = eachRow.dataValues.content ? eachRow.dataValues.content : "";
              replyObj.attachment_image = eachRow.dataValues.file_name
                ? eachRow.dataValues.file_name
                : "";
              obj.reply.push(replyObj);
            }
          }
          communityDataList.push(obj);
        }
      }
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      results: communityDataList,
    });
  } catch (error) {
    next(error);
  }
};
