import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { paginationService } from "../../../services/index.js";
import { Op, fn, col } from "sequelize";

/**
 * favouriteList
 * @param req
 * @param res
 */
export const favouriteList = async (req, res, next) => {
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
    const listType = reqBody.list_type;
    const isFirst = reqBody.is_first;

    let searchParams = {
      page: page,
      limit: limit,
    };

    let resultData = [];
    let resultList = [];
    //1. listType = favorite  - all the relation from title / people / award
    //2. listType = rating  - all the relation from title / people / award
    //1. listType = shared  - all the relation from title / people / award

    if (listType == "favorite") {
      const attributes = [
        "id",
        "favourable_id",
        "user_id",
        "favourable_type",
        "site_language",
        "status",
        "created_at",
      ];

      const modelName = model.favourites;

      const includeQuery = [];

      const condition = {
        status: "active",
        user_id: myPageUserId,
      };
      // calling pagination service
      resultData = await paginationService.pagination(
        searchParams,
        modelName,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData) {
        for (let eachRow of resultData.rows) {
          if (eachRow && eachRow.favourable_type) {
            if (eachRow.favourable_type == "title") {
              const titleData = await model.title.findOne({
                attributes: ["id", "type", "release_date", "release_date_to"],
                where: {
                  id: eachRow.favourable_id,
                  record_status: "active",
                },
                include: [
                  {
                    model: model.titleTranslation,
                    attributes: ["name", "description"],
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
                      original_name: { [Op.ne]: null },
                    },
                    required: false,
                    order: [["id", "DESC"]],
                  },
                ],
              });

              if (titleData) {
                const titleType = titleData && titleData.type ? titleData.type : "";
                const posterImage =
                  titleData && titleData.titleImages.length > 0 && titleData.titleImages[0].path
                    ? titleData.titleImages[0].path
                    : "";
                const titleName =
                  titleData &&
                  titleData.titleTranslations.length > 0 &&
                  titleData.titleTranslations[0].name
                    ? titleData.titleTranslations[0].name
                    : "";
                const titleSummary =
                  titleData &&
                  titleData.titleTranslations.length > 0 &&
                  titleData.titleTranslations[0].description
                    ? titleData.titleTranslations[0].description
                    : "";
                const titleDate1 =
                  titleData && titleData.release_date ? titleData.release_date : "";
                const titleDate2 =
                  titleData && titleData.release_date_to ? titleData.release_date_to : "";

                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: titleName,
                  summary: titleSummary,
                  work_list: [],
                  date_1: titleDate1,
                  date_2: titleDate2,
                  favourable_type: eachRow.favourable_type,
                  favourable_id: eachRow.favourable_id,
                  list_type: titleType,
                  rating: "",
                };
                resultList.push(record);
              }
            }
            if (eachRow.favourable_type == "people") {
              const peopleData = await model.people.findOne({
                attributes: [
                  "birth_date",
                  "death_date",
                  [
                    fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                    "poster",
                  ],
                ],
                where: {
                  id: eachRow.favourable_id,
                  status: "active",
                },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["name"],
                    left: true,
                    where: {
                      site_language: language,
                      status: "active",
                    },
                    required: true,
                  },
                  {
                    model: model.creditable,
                    attributes: ["id", "people_id", "creditable_id"],
                    left: true,
                    where: { creditable_type: "title", status: "active" },
                    required: false,
                    include: {
                      model: model.title,
                      attributes: ["id"],
                      left: true,
                      where: { record_status: "active" },
                      include: {
                        model: model.titleTranslation,
                        left: true,
                        attributes: ["name"],
                        where: { status: "active" },
                      },
                      required: false,
                    },
                  },
                ],
                order: [[model.creditable, "id", "DESC"]],
              });
              if (peopleData) {
                const posterImage = peopleData && peopleData.poster ? peopleData.poster : "";
                const peopleDate1 =
                  peopleData && peopleData.birth_date ? peopleData.birth_date : "";
                const peopleDate2 =
                  peopleData && peopleData.death_date ? peopleData.death_date : "";
                const personName =
                  peopleData &&
                  peopleData.peopleTranslations.length > 0 &&
                  peopleData.peopleTranslations[0].name
                    ? peopleData.peopleTranslations[0].name
                    : "";
                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: personName,
                  summary: "",
                  work_list: [],
                  date_1: peopleDate1,
                  date_2: peopleDate2,
                  favourable_type: eachRow.favourable_type,
                  favourable_id: eachRow.favourable_id,
                  list_type: "people",
                  rating: "",
                };
                // worklist of People
                if (peopleData.creditables && peopleData.creditables.length > 0) {
                  let workList = [];
                  let cnt = 1;
                  for (const eachWork of peopleData.creditables) {
                    if (eachWork) {
                      if (
                        cnt < 5 &&
                        eachWork.titles &&
                        eachWork.titles.length > 0 &&
                        eachWork.titles[0].titleTranslations &&
                        eachWork.titles[0].titleTranslations.length > 0
                      ) {
                        workList.push({
                          title_id:
                            eachWork.titles[0] && eachWork.titles[0].id
                              ? eachWork.titles[0].id
                              : "",
                          title_name:
                            eachWork.titles[0] &&
                            eachWork.titles[0].titleTranslations[0] &&
                            eachWork.titles[0].titleTranslations[0].name
                              ? eachWork.titles[0].titleTranslations[0].name
                              : "",
                        });
                      }
                    }
                    cnt++;
                  }
                  record.work_list = workList;
                }
                resultList.push(record);
              }
            }
            if (eachRow.favourable_type == "award") {
              const awardData = await model.awards.findOne({
                attributes: ["id", "type", "place", "start_date", "end_date"],
                where: {
                  id: eachRow.favourable_id,
                  status: "active",
                },
                include: [
                  {
                    model: model.awardTranslation,
                    attributes: ["award_name", "award_explanation"],
                    left: true,
                    required: true,
                    where: {
                      site_language: language,
                      status: "active",
                    },
                  },
                  {
                    model: model.awardImages,
                    attributes: [
                      "id",
                      "award_id",
                      "original_name",
                      "file_name",
                      [
                        fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
                    ],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    order: [["id", "DESC"]],
                  },
                ],
              });

              if (awardData) {
                const posterImage =
                  awardData && awardData.awardImages.length > 0 && awardData.awardImages[0].path
                    ? awardData.awardImages[0].path
                    : "";
                const awardName =
                  awardData &&
                  awardData.awardTranslations.length > 0 &&
                  awardData.awardTranslations[0].award_name
                    ? awardData.awardTranslations[0].award_name
                    : "";
                const awardSummary =
                  awardData &&
                  awardData.awardTranslations.length > 0 &&
                  awardData.awardTranslations[0].award_explanation
                    ? awardData.awardTranslations[0].award_explanation
                    : "";
                const awardDate1 = awardData && awardData.start_date ? awardData.start_date : "";
                const awardDate2 = awardData && awardData.end_date ? awardData.end_date : "";

                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: awardName,
                  summary: awardSummary,
                  work_list: [],
                  date_1: awardDate1,
                  date_2: awardDate2,
                  favourable_type: eachRow.favourable_type,
                  favourable_id: eachRow.favourable_id,
                  list_type: "award",
                  rating: "",
                };
                resultList.push(record);
              }
            }
          }
        }
      }
    }
    if (listType == "rating") {
      const attributes = [
        "id",
        "ratingable_id",
        "user_id",
        "ratingable_type",
        "site_language",
        "status",
        "created_at",
      ];

      const modelName = model.ratings;

      const includeQuery = [];

      const condition = {
        status: "active",
        user_id: myPageUserId,
      };
      // calling pagination service
      resultData = await paginationService.pagination(
        searchParams,
        modelName,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData) {
        for (let eachRow of resultData.rows) {
          if (eachRow && eachRow.ratingable_type) {
            if (eachRow.ratingable_type == "title") {
              const titleData = await model.title.findOne({
                attributes: [
                  "id",
                  "type",
                  "release_date",
                  "release_date_to",
                  "tmdb_vote_average",
                  [fn("titleRatingCount", col("title.id")), "avg_rating"],
                ],
                where: {
                  id: eachRow.ratingable_id,
                  record_status: "active",
                },
                include: [
                  {
                    model: model.titleTranslation,
                    attributes: ["name", "description"],
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
                      original_name: { [Op.ne]: null },
                    },
                    required: false,
                    order: [["id", "DESC"]],
                  },
                ],
              });

              if (titleData) {
                const titleType = titleData && titleData.type ? titleData.type : "";
                const posterImage =
                  titleData && titleData.titleImages.length > 0 && titleData.titleImages[0].path
                    ? titleData.titleImages[0].path
                    : "";
                const titleName =
                  titleData &&
                  titleData.titleTranslations.length > 0 &&
                  titleData.titleTranslations[0].name
                    ? titleData.titleTranslations[0].name
                    : "";
                const titleSummary =
                  titleData &&
                  titleData.titleTranslations.length > 0 &&
                  titleData.titleTranslations[0].description
                    ? titleData.titleTranslations[0].description
                    : "";
                const titleDate1 =
                  titleData && titleData.release_date ? titleData.release_date : "";
                const titleDate2 =
                  titleData && titleData.release_date_to ? titleData.release_date_to : "";
                const getAvgRating = titleData.dataValues.avg_rating
                  ? titleData.dataValues.avg_rating
                  : 0;
                const totalRating = parseFloat(getAvgRating);
                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: titleName,
                  summary: titleSummary,
                  work_list: [],
                  date_1: titleDate1,
                  date_2: titleDate2,
                  favourable_type: eachRow.ratingable_type,
                  favourable_id: eachRow.ratingable_id,
                  list_type: titleType,
                  rating: totalRating ? totalRating.toFixed(1) : "",
                };
                resultList.push(record);
              }
            }
            if (eachRow.ratingable_type == "people") {
              const peopleData = await model.people.findOne({
                attributes: [
                  "birth_date",
                  "death_date",
                  [
                    fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                    "poster",
                  ],
                ],
                where: {
                  id: eachRow.ratingable_id,
                  status: "active",
                },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["name"],
                    left: true,
                    where: {
                      site_language: language,
                      status: "active",
                    },
                    required: true,
                  },
                  {
                    model: model.creditable,
                    attributes: ["id", "people_id", "creditable_id"],
                    left: true,
                    where: { creditable_type: "title", status: "active" },
                    required: false,
                    include: {
                      model: model.title,
                      attributes: ["id"],
                      left: true,
                      where: { record_status: "active" },
                      include: {
                        model: model.titleTranslation,
                        left: true,
                        attributes: ["name"],
                        where: { status: "active" },
                      },
                      required: false,
                    },
                  },
                ],
                order: [[model.creditable, "id", "DESC"]],
              });
              if (peopleData) {
                const posterImage = peopleData && peopleData.poster ? peopleData.poster : "";
                const peopleDate1 =
                  peopleData && peopleData.birth_date ? peopleData.birth_date : "";
                const peopleDate2 =
                  peopleData && peopleData.death_date ? peopleData.death_date : "";
                const personName =
                  peopleData &&
                  peopleData.peopleTranslations.length > 0 &&
                  peopleData.peopleTranslations[0].name
                    ? peopleData.peopleTranslations[0].name
                    : "";
                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: personName,
                  summary: "",
                  work_list: [],
                  date_1: peopleDate1,
                  date_2: peopleDate2,
                  favourable_type: eachRow.ratingable_type,
                  favourable_id: eachRow.ratingable_id,
                  list_type: "people",
                  rating: "",
                };
                // worklist of People
                if (peopleData.creditables && peopleData.creditables.length > 0) {
                  let workList = [];
                  let cnt = 1;
                  for (const eachWork of peopleData.creditables) {
                    if (eachWork) {
                      if (
                        cnt < 5 &&
                        eachWork.titles &&
                        eachWork.titles.length > 0 &&
                        eachWork.titles[0].titleTranslations &&
                        eachWork.titles[0].titleTranslations.length > 0
                      ) {
                        workList.push({
                          title_id:
                            eachWork.titles[0] && eachWork.titles[0].id
                              ? eachWork.titles[0].id
                              : "",
                          title_name:
                            eachWork.titles[0] &&
                            eachWork.titles[0].titleTranslations[0] &&
                            eachWork.titles[0].titleTranslations[0].name
                              ? eachWork.titles[0].titleTranslations[0].name
                              : "",
                        });
                      }
                    }
                    cnt++;
                  }
                  record.work_list = workList;
                }
                resultList.push(record);
              }
            }
            if (eachRow.ratingable_type == "award") {
              const awardData = await model.awards.findOne({
                attributes: [
                  "id",
                  "type",
                  "place",
                  "start_date",
                  "end_date",
                  [fn("awardRatingCount", col("awards.id")), "avg_rating"],
                ],
                where: {
                  id: eachRow.ratingable_id,
                  status: "active",
                },
                include: [
                  {
                    model: model.awardTranslation,
                    attributes: ["award_name", "award_explanation"],
                    left: true,
                    required: true,
                    where: {
                      site_language: language,
                      status: "active",
                    },
                  },
                  {
                    model: model.awardImages,
                    attributes: [
                      "id",
                      "award_id",
                      "original_name",
                      "file_name",
                      [
                        fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
                    ],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    order: [["id", "DESC"]],
                  },
                ],
              });

              if (awardData) {
                const posterImage =
                  awardData && awardData.awardImages.length > 0 && awardData.awardImages[0].path
                    ? awardData.awardImages[0].path
                    : "";
                const awardName =
                  awardData &&
                  awardData.awardTranslations.length > 0 &&
                  awardData.awardTranslations[0].award_name
                    ? awardData.awardTranslations[0].award_name
                    : "";
                const awardSummary =
                  awardData &&
                  awardData.awardTranslations.length > 0 &&
                  awardData.awardTranslations[0].award_explanation
                    ? awardData.awardTranslations[0].award_explanation
                    : "";
                const awardDate1 = awardData && awardData.start_date ? awardData.start_date : "";
                const awardDate2 = awardData && awardData.end_date ? awardData.end_date : "";

                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: awardName,
                  summary: awardSummary,
                  work_list: [],
                  date_1: awardDate1,
                  date_2: awardDate2,
                  favourable_type: eachRow.ratingable_type,
                  favourable_id: eachRow.ratingable_id,
                  list_type: "award",
                  rating: awardData.dataValues.avg_rating
                    ? parseFloat(awardData.dataValues.avg_rating).toFixed(1)
                    : 0,
                };
                resultList.push(record);
              }
            }
          }
        }
      }
    }
    if (listType == "shared") {
      const attributes = [
        "id",
        "shared_id",
        "user_id",
        "shared_type",
        "site_language",
        "status",
        "created_at",
      ];

      const modelName = model.shared;

      const includeQuery = [];

      const condition = {
        status: "active",
        user_id: myPageUserId,
      };
      // calling pagination service
      resultData = await paginationService.pagination(
        searchParams,
        modelName,
        includeQuery,
        condition,
        attributes,
      );

      if (resultData) {
        for (let eachRow of resultData.rows) {
          if (eachRow && eachRow.shared_type) {
            if (eachRow.shared_type == "title") {
              const titleData = await model.title.findOne({
                attributes: ["id", "type", "release_date", "release_date_to"],
                where: {
                  id: eachRow.shared_id,
                  record_status: "active",
                },
                include: [
                  {
                    model: model.titleTranslation,
                    attributes: ["name", "description"],
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
                      original_name: { [Op.ne]: null },
                    },
                    required: false,
                    order: [["id", "DESC"]],
                  },
                ],
              });

              if (titleData) {
                const titleType = titleData && titleData.type ? titleData.type : "";
                const posterImage =
                  titleData && titleData.titleImages.length > 0 && titleData.titleImages[0].path
                    ? titleData.titleImages[0].path
                    : "";
                const titleName =
                  titleData &&
                  titleData.titleTranslations.length > 0 &&
                  titleData.titleTranslations[0].name
                    ? titleData.titleTranslations[0].name
                    : "";
                const titleSummary =
                  titleData &&
                  titleData.titleTranslations.length > 0 &&
                  titleData.titleTranslations[0].description
                    ? titleData.titleTranslations[0].description
                    : "";
                const titleDate1 =
                  titleData && titleData.release_date ? titleData.release_date : "";
                const titleDate2 =
                  titleData && titleData.release_date_to ? titleData.release_date_to : "";

                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: titleName,
                  summary: titleSummary,
                  work_list: [],
                  date_1: titleDate1,
                  date_2: titleDate2,
                  favourable_type: eachRow.shared_type,
                  favourable_id: eachRow.shared_id,
                  list_type: titleType,
                  rating: "",
                };
                resultList.push(record);
              }
            }
            if (eachRow.shared_type == "people") {
              const peopleData = await model.people.findOne({
                attributes: [
                  "birth_date",
                  "death_date",
                  [
                    fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                    "poster",
                  ],
                ],
                where: {
                  id: eachRow.shared_id,
                  status: "active",
                },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["name"],
                    left: true,
                    where: {
                      site_language: language,
                      status: "active",
                    },
                    required: true,
                  },
                  {
                    model: model.creditable,
                    attributes: ["id", "people_id", "creditable_id"],
                    left: true,
                    where: { creditable_type: "title", status: "active" },
                    required: false,
                    include: {
                      model: model.title,
                      attributes: ["id"],
                      left: true,
                      where: { record_status: "active" },
                      include: {
                        model: model.titleTranslation,
                        left: true,
                        attributes: ["name"],
                        where: { status: "active" },
                      },
                      required: false,
                    },
                  },
                ],
                order: [[model.creditable, "id", "DESC"]],
              });
              if (peopleData) {
                const posterImage = peopleData && peopleData.poster ? peopleData.poster : "";
                const peopleDate1 =
                  peopleData && peopleData.birth_date ? peopleData.birth_date : "";
                const peopleDate2 =
                  peopleData && peopleData.death_date ? peopleData.death_date : "";
                const personName =
                  peopleData &&
                  peopleData.peopleTranslations.length > 0 &&
                  peopleData.peopleTranslations[0].name
                    ? peopleData.peopleTranslations[0].name
                    : "";
                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: personName,
                  summary: "",
                  work_list: [],
                  date_1: peopleDate1,
                  date_2: peopleDate2,
                  favourable_type: eachRow.shared_type,
                  favourable_id: eachRow.shared_id,
                  list_type: "people",
                  rating: "",
                };
                // worklist of People
                if (peopleData.creditables && peopleData.creditables.length > 0) {
                  let workList = [];
                  let cnt = 1;
                  for (const eachWork of peopleData.creditables) {
                    if (eachWork) {
                      if (
                        cnt < 5 &&
                        eachWork.titles &&
                        eachWork.titles.length > 0 &&
                        eachWork.titles[0].titleTranslations &&
                        eachWork.titles[0].titleTranslations.length > 0
                      ) {
                        workList.push({
                          title_id:
                            eachWork.titles[0] && eachWork.titles[0].id
                              ? eachWork.titles[0].id
                              : "",
                          title_name:
                            eachWork.titles[0] &&
                            eachWork.titles[0].titleTranslations[0] &&
                            eachWork.titles[0].titleTranslations[0].name
                              ? eachWork.titles[0].titleTranslations[0].name
                              : "",
                        });
                      }
                    }
                    cnt++;
                  }
                  record.work_list = workList;
                }
                resultList.push(record);
              }
            }
            if (eachRow.shared_type == "award") {
              const awardData = await model.awards.findOne({
                attributes: ["id", "type", "place", "start_date", "end_date"],
                where: {
                  id: eachRow.shared_id,
                  status: "active",
                },
                include: [
                  {
                    model: model.awardTranslation,
                    attributes: ["award_name", "award_explanation"],
                    left: true,
                    required: true,
                    where: {
                      site_language: language,
                      status: "active",
                    },
                  },
                  {
                    model: model.awardImages,
                    attributes: [
                      "id",
                      "award_id",
                      "original_name",
                      "file_name",
                      [
                        fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
                    ],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    order: [["id", "DESC"]],
                  },
                ],
              });

              if (awardData) {
                const posterImage =
                  awardData && awardData.awardImages && awardData.awardImages[0].path
                    ? awardData.awardImages[0].path
                    : "";
                const awardName =
                  awardData &&
                  awardData.awardTranslations.length > 0 &&
                  awardData.awardTranslations[0].award_name
                    ? awardData.awardTranslations[0].award_name
                    : "";
                const awardSummary =
                  awardData &&
                  awardData.awardTranslations.length > 0 &&
                  awardData.awardTranslations[0].award_explanation
                    ? awardData.awardTranslations[0].award_explanation
                    : "";
                const awardDate1 = awardData && awardData.start_date ? awardData.start_date : "";
                const awardDate2 = awardData && awardData.end_date ? awardData.end_date : "";

                const record = {
                  id: eachRow.id,
                  poster_image: posterImage,
                  title_name: awardName,
                  summary: awardSummary,
                  work_list: [],
                  date_1: awardDate1,
                  date_2: awardDate2,
                  favourable_type: eachRow.shared_type,
                  favourable_id: eachRow.shared_id,
                  list_type: "award",
                  rating: "",
                };
                resultList.push(record);
              }
            }
          }
        }
      }
    }

    if (isFirst == "y") {
      const [favoriteCount, ratingCount, sharedCount] = await Promise.all([
        model.favourites.count({
          where: {
            user_id: myPageUserId,
            status: "active",
          },
          distinct: true,
        }),
        model.ratings.count({
          where: {
            user_id: myPageUserId,
            status: "active",
          },
          distinct: true,
        }),
        model.shared.count({
          where: {
            user_id: myPageUserId,
            status: "active",
          },
          distinct: true,
        }),
      ]);
      res.ok({
        page: page,
        limit: limit,
        total_records: resultData.count,
        total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
        list_type: listType,
        tabs: {
          favorite: favoriteCount,
          rating: ratingCount,
          shared: sharedCount,
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
