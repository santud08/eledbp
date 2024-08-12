import model from "../../../models/index.js";
import { paginationService, userPermissionService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { fn, col } from "sequelize";

/**
 * seasonEpisodeDetails
 * @param req
 * @param res
 */
export const seasonEpisodeDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const tvId = reqBody.id ? reqBody.id : "";
    if (!tvId) throw StatusError.badRequest(res.__("id is required"));

    const seasonId = req.query.season_id ? req.query.season_id : null;

    let seasonList = [];
    let episodeList = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const language = req.accept_language;
    // Check tvId & season id is exist
    const getInformations = await model.title.findOne({
      attributes: [
        "id",
        "type",
        "release_date",
        "year",
        "country",
        "certification",
        "runtime",
        "language",
        "footfalls",
        "affiliate_link",
        "rating",
        "tmdb_vote_average",
        "record_status",
      ],
      where: { id: tvId, record_status: "active" },
      include: [
        {
          model: model.titleTranslation,
          left: true,
          attributes: ["title_id", "name", "site_language"],
          where: { status: "active" },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
        {
          model: model.titleImage,
          attributes: [
            "title_id",
            "original_name",
            "file_name",
            "url",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: { image_category: "poster_image", is_main_poster: "y" },
          required: false,
          separate: true, //get the recently added image
          order: [["id", "DESC"]],
        },
        {
          model: model.titleImage,
          attributes: [
            ["original_name", "bg_original_name"],
            ["file_name", "bg_file_name"],
            ["url", "bg_url"],
            ["path", "bg_path"],
          ],
          left: true,
          as: "titleImageBg",
          where: {
            status: "active",
            image_category: "bg_image",
          },
          required: false,
          separate: true, //get the recently added image
          order: [["id", "DESC"]],
        },
        {
          model: model.season,
          attributes: ["id", "title_id", "season_name"],
          left: true,
          where: {
            id: seasonId,
            status: "active",
          },
          include: [
            {
              model: model.seasonTranslation,
              attributes: ["id", "season_id", "season_name", "site_language"],
              left: true,
              where: { status: "active" },
              required: false,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          ],
          required: true,
        },
      ],
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title or season id"));

    //check edit permission
    const isEdit = await userPermissionService.checkEditorPermission(
      req,
      tvId,
      getInformations.type,
    );

    // Get Season details
    const getSeasonList = await model.season.findAll({
      where: { status: "active", title_id: tvId },
      attributes: ["id", "release_date", "number", "season_name"],
      include: [
        {
          model: model.seasonTranslation,
          attributes: ["id", "season_id", "season_name", "site_language"],
          left: true,
          where: { status: "active" },
          required: false,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ],
      order: [["number", "DESC"]],
    });
    if (getSeasonList) {
      let list = [];
      for (const eachRow of getSeasonList) {
        if (eachRow) {
          const record = {
            season_id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
            season_name:
              eachRow.dataValues.seasonTranslations &&
              eachRow.dataValues.seasonTranslations.length > 0 &&
              eachRow.dataValues.seasonTranslations[0].dataValues.season_name
                ? eachRow.dataValues.seasonTranslations[0].dataValues.season_name
                : "",
            season_number: eachRow.dataValues.number
              ? res.__("season") + " " + eachRow.dataValues.number
              : "Special",
          };
          list.push(record);
        }
      }
      seasonList = list;
    }
    // Get episode details
    const searchParams = {
      sortBy: "id",
      sortOrder: "asc",
    };
    const attributes = [
      "id",
      "name",
      "description",
      "poster",
      "release_date",
      "title_id",
      "season_id",
      "season_number",
      "episode_number",
      "year",
      "popularity",
    ];
    const includeQuery = [
      {
        model: model.episodeTranslation,
        attributes: ["id", "episode_id", "name", "description", "site_language"],
        left: true,
        where: { status: "active" },
        required: false,
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
    ];
    const condition = {
      status: "active",
      season_id: seasonId,
      title_id: tvId,
    };
    const getEpisodeList = await paginationService.pagination(
      searchParams,
      model.episode,
      includeQuery,
      condition,
      attributes,
    );

    if (getEpisodeList.count > 0) {
      let list = [];
      for (const eachRow of getEpisodeList.rows) {
        if (eachRow) {
          let episodeName =
            eachRow.episodeTranslations &&
            eachRow.episodeTranslations.length > 0 &&
            eachRow.episodeTranslations[0].name
              ? eachRow.episodeTranslations[0].name
              : "";
          episodeName =
            episodeName == "" &&
            eachRow.episodeTranslations &&
            eachRow.episodeTranslations.length > 1 &&
            eachRow.episodeTranslations[1].name
              ? eachRow.episodeTranslations[1].name
              : episodeName;
          let episodeDescription =
            eachRow.episodeTranslations &&
            eachRow.episodeTranslations.length > 0 &&
            eachRow.episodeTranslations[0].description
              ? eachRow.episodeTranslations[0].description
              : "";
          episodeDescription =
            episodeDescription == "" &&
            eachRow.episodeTranslations &&
            eachRow.episodeTranslations.length > 1 &&
            eachRow.episodeTranslations[1].description
              ? eachRow.episodeTranslations[1].description
              : episodeDescription;
          const record = {
            episode_id: eachRow.id ? eachRow.id : "",
            episode_name: episodeName,
            episode_description: episodeDescription,
            episode_poster_image: eachRow.poster ? eachRow.poster : "",
            episode_number: eachRow.episode_number ? eachRow.episode_number : "",
            episode_release_date: eachRow.release_date
              ? await customDateTimeHelper.changeDateFormat(
                  eachRow.dataValues.release_date,
                  "MMM DD,YYYY",
                )
              : "",
          };
          list.push(record);
        }
      }
      episodeList = list;
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: getEpisodeList.count,
      total_pages: getEpisodeList.count > 0 ? Math.ceil(getEpisodeList.count / limit) : 0,
      title_name:
        getInformations.titleTranslations[0] && getInformations.titleTranslations[0].name
          ? getInformations.titleTranslations[0].name
          : "",
      is_edit: isEdit,
      title_poster_image:
        getInformations.titleImages[0] && getInformations.titleImages[0].path
          ? getInformations.titleImages[0].path
          : "",
      background_image: !getInformations.titleImageBg[0]
        ? ""
        : getInformations.titleImageBg[0].dataValues.bg_path,
      season_id:
        getInformations.dataValues.seasons[0] && getInformations.dataValues.seasons[0].id
          ? getInformations.dataValues.seasons[0].id
          : "",
      season_name:
        getInformations &&
        getInformations.dataValues.seasons &&
        getInformations.dataValues.seasons.length > 0 &&
        getInformations.dataValues.seasons[0] &&
        getInformations.dataValues.seasons[0].dataValues.seasonTranslations &&
        getInformations.dataValues.seasons[0].dataValues.seasonTranslations.length > 0 &&
        getInformations.dataValues.seasons[0].dataValues.seasonTranslations[0].season_name
          ? getInformations.dataValues.seasons[0].dataValues.seasonTranslations[0].season_name
          : "",
      season_list: seasonList ? seasonList : "",
      episode_list: episodeList ? episodeList : "",
    });
  } catch (error) {
    next(error);
  }
};
