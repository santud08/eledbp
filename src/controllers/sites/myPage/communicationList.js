import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { paginationService } from "../../../services/index.js";
import { fn, col, Op } from "sequelize";

/**
 * communicationList
 * @param req
 * @param res
 */
export const communicationList = async (req, res, next) => {
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
    const language = req.accept_language;
    const communicationType = reqBody.communication_type;
    const isFirst = reqBody.is_first;

    const searchParams = {
      page: page,
      limit: limit,
    };

    let resultData = [];

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
      "famouse_id",
      [
        fn("REPLACE", col("community.file_name"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
        "file_name",
      ],
      "commentable_id",
      "site_language",
      "status",
      "created_at",
      [fn("communityLikeCount", col("community.id")), "number_of_like"],
      "character_id",
    ];

    const includeQuery = [];

    let condition = {
      status: "active",
      user_id: myPageUserId,
    };

    // condition for different communication Type
    if (communicationType == "comment") {
      condition.community_type = "comment";
    }
    if (communicationType == "trivia") {
      condition.community_type = "trivia";
    }
    if (communicationType == "famous_line") {
      condition.community_type = "famous_line";
    }
    if (communicationType == "goofs") {
      condition.community_type = "goofs";
    }

    // calling pagination service
    resultData = await paginationService.pagination(
      searchParams,
      model.community,
      includeQuery,
      condition,
      attributes,
    );

    let communityDataList = [];

    if (resultData) {
      for (const eachRow of resultData.rows) {
        if (eachRow) {
          let posterImage = "";
          let titleName = "";
          let personName = "";
          let repliedTo = "";
          let listType = "";
          let titleId = "";
          let titleType = "";
          let personId = "";
          let characterDescription = "";
          // 1. To get the replied to details
          if (eachRow.parent_id != 0) {
            const findRepliedTODetails = await model.community.findOne({
              attributes: ["user_id"],
              where: { id: eachRow.id, parent_id: eachRow.parent_id, status: "active" },
              include: {
                attributes: ["username"],
                model: model.user,
                where: {
                  status: "active",
                },
              },
            });
            repliedTo =
              findRepliedTODetails &&
              findRepliedTODetails.user &&
              findRepliedTODetails.user.dataValues &&
              findRepliedTODetails.user.dataValues.username
                ? findRepliedTODetails.user.dataValues.username
                : "";
          } else {
            repliedTo = "";
          }
          // 2.Famous line :
          // To get the title name and title picture if commentable type people - famous id is title_id
          // To get the people name and people picture if commentable type title - famous id is people_id
          if (
            (eachRow.famouse_id || eachRow.character_id) &&
            eachRow.commentable_type &&
            eachRow.community_type == "famous_line"
          ) {
            if (eachRow.commentable_type == "title") {
              const findTitleDetails = await model.title.findOne({
                attributes: ["id", "type"],
                where: {
                  id: eachRow.commentable_id,
                  record_status: "active",
                },
                include: [
                  {
                    model: model.titleTranslation,
                    attributes: ["name"],
                    left: true,
                    required: true,
                    where: {
                      status: "active",
                      site_language: language,
                    },
                  },
                  {
                    model: model.titleImage,
                    attributes: [
                      "id",
                      "title_id",
                      "original_name",
                      "file_name",
                      [
                        fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
                    ],
                    left: true,
                    where: {
                      status: "active",
                      image_category: "poster_image",
                      is_main_poster: "y",
                      episode_id: null,
                      original_name: {
                        [Op.ne]: null,
                      },
                      [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
                    },
                    required: false,
                    separate: true, //get the recently added image
                    order: [["id", "DESC"]],
                  },
                ],
              });

              titleName =
                findTitleDetails &&
                findTitleDetails.titleTranslations &&
                findTitleDetails.titleTranslations[0] &&
                findTitleDetails.titleTranslations[0].name
                  ? findTitleDetails.titleTranslations[0].name
                  : "";
              listType = findTitleDetails && findTitleDetails.type ? findTitleDetails.type : "";
              if (listType == "webtoons" && eachRow.character_id > 0) {
                const getCharacter = await model.creditable.findOne({
                  attributes: ["id"],
                  where: {
                    id: eachRow.character_id,
                    creditable_id: eachRow.commentable_id,
                    status: "active",
                    department: "character",
                  },
                  include: [
                    {
                      model: model.creditableTranslation,
                      as: "creditableTranslationOne",
                      attributes: [
                        "character_name",
                        [
                          fn(
                            "REPLACE",
                            col("creditableTranslationOne.character_image"),
                            `${envs.s3.BUCKET_URL}`,
                            `${envs.aws.cdnUrl}`,
                          ),
                          "character_image",
                        ],
                        "description",
                      ],
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
                      attributes: [
                        "character_name",
                        [
                          fn(
                            "REPLACE",
                            col("creditableTranslationOnel.character_image"),
                            `${envs.s3.BUCKET_URL}`,
                            `${envs.aws.cdnUrl}`,
                          ),
                          "character_image",
                        ],
                        "description",
                      ],
                      left: true,
                      where: {
                        status: "active",
                        site_language: "ko",
                      },
                      required: false,
                    },
                  ],
                  required: false,
                });
                if (getCharacter) {
                  const characterNameEn =
                    getCharacter.creditableTranslationOne &&
                    getCharacter.creditableTranslationOne.character_name
                      ? getCharacter.creditableTranslationOne.character_name
                      : "";
                  const characterImageEn =
                    getCharacter.creditableTranslationOne &&
                    getCharacter.creditableTranslationOne.character_image
                      ? getCharacter.creditableTranslationOne.character_image
                      : "";
                  const characterDescriptionEn =
                    getCharacter.creditableTranslationOne &&
                    getCharacter.creditableTranslationOne.description
                      ? getCharacter.creditableTranslationOne.description
                      : "";
                  const characterNameKo =
                    getCharacter.creditableTranslationOnel &&
                    getCharacter.creditableTranslationOnel.character_name
                      ? getCharacter.creditableTranslationOnel.character_name
                      : "";
                  const characterImageKo =
                    getCharacter.creditableTranslationOnel &&
                    getCharacter.creditableTranslationOnel.character_image
                      ? getCharacter.creditableTranslationOnel.character_image
                      : "";
                  const characterDescriptionKo =
                    getCharacter.creditableTranslationOnel &&
                    getCharacter.creditableTranslationOnel.description
                      ? getCharacter.creditableTranslationOnel.description
                      : "";
                  if (language == "ko") {
                    personName = characterNameKo ? characterNameKo : characterNameEn;
                    posterImage = characterImageKo ? characterImageKo : characterImageEn;
                    characterDescription = characterDescriptionKo
                      ? characterDescriptionKo
                      : characterDescriptionEn;
                  }
                  if (language == "en") {
                    personName = characterNameEn ? characterNameEn : characterNameKo;
                    posterImage = characterImageEn ? characterImageEn : characterImageKo;
                    characterDescription = characterDescriptionEn
                      ? characterDescriptionEn
                      : characterDescriptionKo;
                  }
                }
              } else if (eachRow.famouse_id > 0) {
                const findPeopleDetails = await model.people.findOne({
                  attributes: [
                    "id",
                    [
                      fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                      "poster",
                    ],
                  ],
                  where: {
                    id: eachRow.famouse_id,
                    status: "active",
                  },
                  include: {
                    model: model.peopleTranslation,
                    attributes: ["name"],
                    where: {
                      status: "active",
                      site_language: language,
                    },
                  },
                });
                posterImage =
                  findPeopleDetails && findPeopleDetails.poster ? findPeopleDetails.poster : "";
                personName =
                  findPeopleDetails &&
                  findPeopleDetails.peopleTranslations &&
                  findPeopleDetails.peopleTranslations[0] &&
                  findPeopleDetails.peopleTranslations[0].name
                    ? findPeopleDetails.peopleTranslations[0].name
                    : "";
                personId = findPeopleDetails && findPeopleDetails.id ? findPeopleDetails.id : "";
              }
            } else if (eachRow.commentable_type == "people") {
              const [findPeopleDetails, findTitleDetails] = await Promise.all([
                await model.people.findOne({
                  attributes: [
                    [
                      fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                      "poster",
                    ],
                  ],
                  where: {
                    id: eachRow.commentable_id,
                    status: "active",
                  },
                  include: {
                    model: model.peopleTranslation,
                    attributes: ["name"],
                    where: {
                      site_language: language,
                      status: "active",
                    },
                  },
                }),
                await model.title.findOne({
                  attributes: ["id", "type"],
                  where: {
                    id: eachRow.famouse_id,
                    record_status: "active",
                  },
                  include: [
                    {
                      model: model.titleTranslation,
                      attributes: ["name"],
                      left: true,
                      required: true,
                      where: {
                        site_language: language,
                        status: "active",
                      },
                    },
                    {
                      model: model.titleImage,
                      attributes: [
                        "id",
                        "title_id",
                        "original_name",
                        "file_name",
                        [
                          fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                          "path",
                        ],
                      ],
                      left: true,
                      where: {
                        status: "active",
                        image_category: "poster_image",
                        is_main_poster: "y",
                        episode_id: null,
                        original_name: {
                          [Op.ne]: null,
                        },
                        [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
                      },
                      required: false,
                      separate: true, //get the recently added image
                      order: [["id", "DESC"]],
                    },
                  ],
                }),
              ]);
              posterImage =
                findTitleDetails &&
                findTitleDetails.titleImages &&
                findTitleDetails.titleImages[0] &&
                findTitleDetails.titleImages[0].path
                  ? findTitleDetails.titleImages[0].path
                  : "";
              titleName =
                findTitleDetails &&
                findTitleDetails.titleTranslations &&
                findTitleDetails.titleTranslations[0] &&
                findTitleDetails.titleTranslations[0].name
                  ? findTitleDetails.titleTranslations[0].name
                  : "";
              personName =
                findPeopleDetails &&
                findPeopleDetails.peopleTranslations &&
                findPeopleDetails.peopleTranslations[0] &&
                findPeopleDetails.peopleTranslations[0].name
                  ? findPeopleDetails.peopleTranslations[0].name
                  : "";
              titleId = findTitleDetails && findTitleDetails.id ? findTitleDetails.id : "";
              titleType = findTitleDetails && findTitleDetails.type ? findTitleDetails.type : "";
              listType = "people";
            }
          }
          // 3.Comment, Trivia and Goofs
          if (eachRow.community_type != "famous_line") {
            if (eachRow.commentable_type == "title") {
              const findTitleDetails = await model.title.findOne({
                attributes: ["id", "type"],
                where: {
                  id: eachRow.commentable_id,
                  record_status: "active",
                },
                include: [
                  {
                    model: model.titleTranslation,
                    attributes: ["name"],
                    left: true,
                    required: true,
                    where: {
                      site_language: language,
                      status: "active",
                    },
                  },
                  {
                    model: model.titleImage,
                    attributes: [
                      "id",
                      "title_id",
                      "original_name",
                      "file_name",
                      [
                        fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
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
                      [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
                    },
                    required: false,
                    separate: true, //get the recently added image
                    order: [["id", "DESC"]],
                  },
                ],
              });
              posterImage =
                findTitleDetails &&
                findTitleDetails.titleImages &&
                findTitleDetails.titleImages[0] &&
                findTitleDetails.titleImages[0].path
                  ? findTitleDetails.titleImages[0].path
                  : "";
              titleName =
                findTitleDetails &&
                findTitleDetails.titleTranslations &&
                findTitleDetails.titleTranslations[0] &&
                findTitleDetails.titleTranslations[0].name
                  ? findTitleDetails.titleTranslations[0].name
                  : "";
              listType = findTitleDetails && findTitleDetails.type ? findTitleDetails.type : "";
            } else if (eachRow.commentable_type == "people") {
              const findPeopleDetails = await model.people.findOne({
                attributes: ["poster"],
                where: {
                  id: eachRow.commentable_id,
                  status: "active",
                },
                include: {
                  model: model.peopleTranslation,
                  attributes: ["name"],
                  where: {
                    site_language: language,
                    status: "active",
                  },
                },
              });

              posterImage =
                findPeopleDetails && findPeopleDetails.poster ? findPeopleDetails.poster : "";
              personName =
                findPeopleDetails &&
                findPeopleDetails.peopleTranslations &&
                findPeopleDetails.peopleTranslations[0] &&
                findPeopleDetails.peopleTranslations[0].name
                  ? findPeopleDetails.peopleTranslations[0].name
                  : "";
              listType = "people";
            }
          }

          const communicationData = {
            id: eachRow.id ? eachRow.id : "",
            poster_image: posterImage,
            title_name: titleName,
            title_id: titleId,
            title_type: titleType,
            person_name: personName,
            person_id: personId,
            post_text: eachRow.content ? eachRow.content : "",
            post_upload_image: eachRow.file_name ? eachRow.file_name : "",
            post_liked: eachRow.dataValues.number_of_like ? eachRow.dataValues.number_of_like : "",
            replied_to: repliedTo,
            posted_date: eachRow.created_at ? eachRow.created_at : "",
            commentable_type: eachRow.commentable_type ? eachRow.commentable_type : "",
            commentable_id: eachRow.commentable_id ? eachRow.commentable_id : "",
            list_type: listType ? listType : "",
            character_description: characterDescription,
          };
          communityDataList.push(communicationData);
        }
      }
    }
    if (isFirst == "y") {
      const [commentCount, triviaCount, famousLinesCount, goofsCount] = await Promise.all([
        model.community.count({
          where: {
            user_id: myPageUserId,
            status: "active",
            community_type: "comment",
          },
          distinct: true,
        }),
        model.community.count({
          where: {
            user_id: myPageUserId,
            status: "active",
            community_type: "trivia",
          },
          distinct: true,
        }),
        model.community.count({
          where: {
            user_id: myPageUserId,
            status: "active",
            community_type: "famous_line",
          },
          distinct: true,
        }),
        model.community.count({
          where: {
            user_id: myPageUserId,
            status: "active",
            community_type: "goofs",
          },
          distinct: true,
        }),
      ]);
      res.ok({
        page: page,
        limit: limit,
        total_records: resultData.count,
        total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
        communication_type: communicationType,
        tabs: {
          comment: commentCount,
          trivia: triviaCount,
          famous_line: famousLinesCount,
          goofs: goofsCount,
        },
        results: communityDataList,
      });
    } else {
      res.ok({
        page: page,
        limit: limit,
        total_records: resultData.count,
        total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
        communication_type: communicationType,
        results: communityDataList,
      });
    }
  } catch (error) {
    next(error);
  }
};
