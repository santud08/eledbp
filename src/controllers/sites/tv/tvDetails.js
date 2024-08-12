import model from "../../../models/index.js";
import { Op, fn, col, Sequelize } from "sequelize";
import { StatusError, envs } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";
import { awardService, userPermissionService } from "../../../services/index.js";

/**
 * tvDetails
 * @param req
 * @param res
 */

export const tvDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const tvId = reqBody.id; //It will be tv id
    let getCastList = "";
    let getGenreList = "";
    let getCountryList = "";
    let getOriginalByList = "";
    let getDirector = "";
    let getWriter = "";
    let seasonYearList = [],
      channelList = [],
      seasonNameList = [];

    let language = req.accept_language;
    let getInformations = await getInformationsMethod(userId, tvId, language);
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title id"));

    const [
      getSeasonList,
      getCountry,
      awards,
      getOriginalBy,
      getCast,
      getGenre,
      getChannelList,
      isEdit,
    ] = await Promise.all([
      model.season.findAll({
        where: { status: "active", title_id: tvId },
        attributes: [
          "id",
          [Sequelize.fn("date_format", Sequelize.col("release_date"), "%Y"), "release_year"],
          "number",
          "season_name",
        ],
        include: [
          {
            model: model.seasonTranslation,
            attributes: ["season_id", "season_name", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
        order: [["number", "DESC"]],
      }),
      model.titleCountries.findAll({
        attributes: ["title_id", "country_id"],
        where: { title_id: tvId, status: "active" },
        include: [
          {
            model: model.country,
            left: true,
            attributes: ["id", "country_name"],
            where: { status: "active" },
            required: true,
            include: {
              model: model.countryTranslation,
              attributes: ["country_id", "country_name", "site_language"],
              left: true,
              where: { status: "active" },
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          },
        ],
      }),
      //awards
      awardService.getTitleWinnerAndNomineeCount(tvId),
      model.originalWorks.findAll({
        attributes: ["title_id", "ow_type", "ow_title", "ow_original_artis"],
        where: { title_id: tvId, status: "active", site_language: language },
      }),
      model.creditable.findAll({
        attributes: ["id", "people_id", "creditable_id", "department"],
        where: {
          creditable_id: tvId,
          creditable_type: "title",
          department: "cast",
          status: "active",
        },
        include: [
          {
            model: model.people,
            left: true,
            attributes: ["id", "gender"],
            where: { status: "active" },
          },
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
        order: [["id", "ASC"]],
        group: ["people_id"],
      }),
      model.tagGable.findAll({
        attributes: ["tag_id", "taggable_id", "taggable_type"],
        where: {
          taggable_id: tvId,
          taggable_type: "title",
          status: "active",
        },
        include: [
          {
            model: model.tag,
            left: true,
            attributes: ["id", "type"],
            where: { type: "genre", status: "active" },
          },
          {
            model: model.tagTranslation,
            attributes: ["tag_id", "display_name", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
      }),
      model.titleChannelList.findAll({
        attributes: ["id", "title_id", "url", "tv_network_id", "season_id"],
        where: { title_id: tvId, status: "active" },
        include: [
          {
            model: model.tvNetworks,
            left: true,
            attributes: ["network_name", "logo"],
            where: { status: "active" },
          },
        ],
        group: ["tv_network_id"],
      }),
      //check edit permission
      userPermissionService.checkEditorPermission(req, tvId, "tv"),
    ]);
    // Get Season details
    if (getSeasonList) {
      let yearList = [];
      let seasonList = [];
      let normalSeason = [];
      let specialSeason = [];
      for (const eachRow of getSeasonList) {
        if (eachRow) {
          if (eachRow.dataValues.number != 0) {
            const record = {
              id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              name:
                eachRow.dataValues.seasonTranslation &&
                eachRow.dataValues.seasonTranslation.length > 0 &&
                eachRow.dataValues.seasonTranslation[0] &&
                eachRow.dataValues.seasonTranslation[0].dataValues.season_name
                  ? eachRow.dataValues.seasonTranslation[0].dataValues.season_name
                  : "",
              season_number: eachRow.dataValues.number
                ? res.__("season") + " " + eachRow.dataValues.number
                : "",
            };
            normalSeason.push(record);
          } else {
            const record = {
              id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
              name:
                eachRow.dataValues.seasonTranslation &&
                eachRow.dataValues.seasonTranslation.length > 0 &&
                eachRow.dataValues.seasonTranslation[0] &&
                eachRow.dataValues.seasonTranslation[0].dataValues.season_name
                  ? eachRow.dataValues.seasonTranslation[0].dataValues.season_name
                  : "",
              season_number: eachRow.dataValues.number == 0 ? res.__("Special") : "",
            };
            specialSeason.push(record);
          }

          const year = eachRow.dataValues.release_year ? eachRow.dataValues.release_year : "";
          year != "" && yearList.indexOf(year) === -1 ? yearList.push(year) : "";
        }
      }
      seasonList = [...normalSeason, ...specialSeason];
      seasonYearList = yearList.join("-");
      seasonNameList = seasonList;
    }

    const totalRating = getInformations.dataValues.avg_rating
      ? getInformations.dataValues.avg_rating
      : 0;
    // Get Country
    if (getCountry) {
      let list = [];
      for (const eachRow of getCountry) {
        if (eachRow) {
          const name =
            eachRow.country &&
            eachRow.country.countryTranslations[0] &&
            eachRow.country.countryTranslations[0].country_name
              ? eachRow.country.countryTranslations[0].country_name
              : "";
          list.push(name);
        }
      }
      getCountryList = list.join(", ");
    }

    // Get Original By
    if (getOriginalBy) {
      let list = [];
      for (const eachRow of getOriginalBy) {
        if (eachRow) {
          const owType = eachRow.ow_type ? eachRow.ow_type : "";
          const owTitle = eachRow.ow_title ? eachRow.ow_title : "";
          const owOriginalArtis = eachRow.ow_original_artis ? eachRow.ow_original_artis : "";
          const originalBy = owTitle + "(" + owType + ") - " + owOriginalArtis;
          list.push(originalBy);
        }
      }
      getOriginalByList = list.join(", ");
    }

    // Get Director
    const getDirectorDepartment = await model.departmentJob
      .findAll({
        where: { status: "active", department_id: 10 },
        attributes: ["id", "job_name"],
        include: [
          {
            model: model.department,
            left: true,
            required: true,
            where: { status: "active" },
          },
        ],
        raw: true,
      })
      .then((departmentJobs) => departmentJobs.map((departmentJob) => departmentJob.job_name));
    let directorList = [];
    if (getDirectorDepartment && getDirectorDepartment.length > 0) {
      getDirector = await model.creditable.findAll({
        attributes: ["people_id", "creditable_id", "department"],
        where: {
          creditable_id: tvId,
          creditable_type: "title",
          job: {
            [Op.in]: getDirectorDepartment,
          },
          status: "active",
        },
        include: [
          {
            model: model.people,
            left: true,
            attributes: ["id", "gender"],
            where: { status: "active" },
          },
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
        group: ["people_id"],
      });

      if (getDirector && getDirector.length > 0) {
        for (const eachDirector of getDirector) {
          if (eachDirector) {
            const element = {
              id:
                eachDirector && eachDirector.peopleTranslations[0]
                  ? eachDirector.peopleTranslations[0].people_id
                  : "",
              name:
                eachDirector && eachDirector.peopleTranslations[0]
                  ? eachDirector.peopleTranslations[0].name
                  : "",
            };
            directorList.push(element);
          }
        }
      }
    }

    // Get Writer
    const getWriterDepartment = await model.departmentJob
      .findAll({
        where: { status: "active", department_id: 3 },
        attributes: ["id", "job_name"],
        include: [
          {
            model: model.department,
            left: true,
            required: true,
            where: { status: "active" },
          },
        ],
        raw: true,
      })
      .then((departmentJobs) => departmentJobs.map((departmentJob) => departmentJob.job_name));
    let writerList = [];
    if (getWriterDepartment && getWriterDepartment.length > 0) {
      getWriter = await model.creditable.findAll({
        attributes: ["people_id", "creditable_id", "department"],
        where: {
          creditable_id: tvId,
          creditable_type: "title",
          job: { [Op.in]: getWriterDepartment },
          status: "active",
        },
        include: [
          {
            model: model.people,
            left: true,
            attributes: ["id", "gender"],
            where: { status: "active" },
          },
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
        group: ["people_id"],
      });

      if (getWriter && getWriter.length > 0) {
        for (const eachWriter of getWriter) {
          if (eachWriter) {
            const element = {
              id: eachWriter.peopleTranslations[0]
                ? eachWriter.peopleTranslations[0].people_id
                : "",
              name: eachWriter.peopleTranslations[0] ? eachWriter.peopleTranslations[0].name : "",
            };
            writerList.push(element);
          }
        }
      }
    }

    // Cast name
    if (getCast) {
      let list = [];
      for (const eachRow of getCast) {
        if (eachRow) {
          const element = {
            id:
              eachRow.peopleTranslations[0] && eachRow.peopleTranslations[0].people_id
                ? eachRow.peopleTranslations[0].people_id
                : "",
            name:
              eachRow.peopleTranslations[0] && eachRow.peopleTranslations[0].name
                ? eachRow.peopleTranslations[0].name
                : "",
          };
          list.push(element);
        }
      }
      getCastList = list;
    }

    // Get Genre
    if (getGenre) {
      let list = [];
      for (const eachRow of getGenre) {
        if (eachRow) {
          const name =
            eachRow.tagTranslations[0] && eachRow.tagTranslations[0].display_name
              ? eachRow.tagTranslations[0].display_name
              : "";
          list.push(name);
        }
      }
      getGenreList = list.join(", ");
    }

    // Get Channel List
    if (getChannelList) {
      let list = [];
      for (const eachRow of getChannelList) {
        if (eachRow) {
          const record = {
            id: eachRow.id ? eachRow.id : "",
            network_name: eachRow.tvNetwork.network_name ? eachRow.tvNetwork.network_name : "",
            icon: eachRow.tvNetwork.logo
              ? await generalHelper.generateNetworkLogoUrl(req, eachRow.tvNetwork.logo)
              : "",
          };
          list.push(record);
        }
      }
      channelList = list;
    }
    let certificationText = getInformations.certification ? getInformations.certification : "";
    if (certificationText && Number.isInteger(certificationText) == false) {
      certificationText = res.__(certificationText);
    }
    res.ok({
      id: tvId,
      certification: certificationText, // Age limit of viewing
      title:
        getInformations.titleTranslations[0] && getInformations.titleTranslations[0].name
          ? getInformations.titleTranslations[0].name
          : "",
      type: getInformations.type ? getInformations.type : "",
      is_edit: isEdit,
      genre: getGenreList,
      year: seasonYearList ? seasonYearList : "",
      runtime: getInformations.runtime ? getInformations.runtime : "",
      no_of_likes: getInformations.dataValues.numberOfLikes
        ? getInformations.dataValues.numberOfLikes
        : "",
      is_like: getInformations.dataValues.is_liked ? getInformations.dataValues.is_liked : "n",
      rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
      user_rating: getInformations.get("user_rating") ? getInformations.get("user_rating") : 0,
      details:
        getInformations.titleTranslations[0] && getInformations.titleTranslations[0].description
          ? getInformations.titleTranslations[0].description
          : "",
      director_name: directorList,
      writer_name: writerList,
      cast: getCastList,
      original_by: getOriginalByList ? getOriginalByList : "",
      official_site: getInformations.affiliate_link ? getInformations.affiliate_link : "",
      country: getCountryList ? getCountryList : "",
      language: getInformations.language ? getInformations.language : "",
      award: awards ? awards : {},
      poster_image: !getInformations.titleImages[0] ? "" : getInformations.titleImages[0].path,
      background_image: !getInformations.titleImageBg[0]
        ? ""
        : getInformations.titleImageBg[0].dataValues.bg_path,
      channel_list: channelList,
      season_name_list: seasonNameList ? seasonNameList : "",
    });
  } catch (error) {
    next(error);
  }
};
const getInformationsMethod = async (userId, tvId, language) => {
  return await model.title.findOne({
    attributes: [
      "id",
      "type",
      "release_date",
      "year",
      "country",
      "certification",
      "runtime",
      "language",
      "affiliate_link",
      "rating",
      "tmdb_vote_average",
      "record_status",
      [fn("titleRatingCount", col("title.id")), "avg_rating"],
      [fn("titleLikeCount", col("title.id")), "numberOfLikes"],
      [fn("isTitleLiked", col("title.id"), userId), "is_liked"],
      [fn("getUserRatings", col("title.id"), "title", userId), "user_rating"],
    ],
    where: { id: tvId, record_status: "active", type: "tv" },
    include: [
      {
        model: model.titleTranslation,
        left: true,
        attributes: ["name", "aka", "description", "plot_summary", "site_language"],
        where: { status: "active" },
        required: false,
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
          [
            fn("REPLACE", col("titleImage.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
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
        },
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
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "bg_path"],
        ],
        left: true,
        as: "titleImageBg",
        where: {
          status: "active",
          image_category: "bg_image",
          episode_id: null,
        },
        required: false,
        separate: true, //get the recently added image
        order: [["id", "DESC"]],
      },
    ],
  });
};
