import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Sequelize, fn, col } from "sequelize";

/**
 * editWtEpisodeRequestList
 * @param req
 * @param res
 */
export const editWtEpisodeRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    let data = [];
    const titleId = req.body.title_id;
    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const siteLanguage = req.body.site_language;
    const seasonId = req.body.season_id ? req.body.season_id : "";
    const searchText = req.body.search_text ? req.body.search_text : "";

    const titleData = await model.title.findOne({
      where: { id: titleId, record_status: "active" },
    });
    if (!titleData) throw StatusError.badRequest(res.__("Invalid Title Id"));

    let condition = {};
    if (draftSeasonId) {
      condition = {
        request_id: requestId,
        request_season_id: draftSeasonId,
        status: "active",
      };
    } else if (seasonId) {
      condition = {
        request_id: requestId,
        season_id: seasonId,
        status: "active",
      };
    }
    let findAllEpisodeRequest = [];
    if (Object.keys(condition).length > 0) {
      findAllEpisodeRequest = await model.titleRequestEpisodeDetails.findAll({
        attributes: [
          "id",
          "request_id",
          "request_season_id",
          [Sequelize.json("episode_details.list"), "episode_details_list"],
        ],
        where: condition,
        status: "active",
      });
    }

    const findAllSeasonDetails = await model.titleRequestSeasonDetails.findOne({
      where: {
        id: draftSeasonId,
        request_id: requestId,
        status: "active",
      },
    });
    // get relationID from Request Table
    let getRelationData = {};
    if (requestId) {
      getRelationData = await model.titleRequestPrimaryDetails.findOne({
        where: {
          id: requestId,
          record_status: "active",
        },
      });
    }
    const relationId =
      getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "";
    if (findAllEpisodeRequest.length > 0) {
      for (const value of findAllEpisodeRequest) {
        const parsedEpisodeDetails =
          value && value.dataValues && value.dataValues.episode_details_list
            ? JSON.parse(value.dataValues.episode_details_list)
            : "";
        if (parsedEpisodeDetails && parsedEpisodeDetails != "" && searchText && searchText != "") {
          const fparsedEpisodeDetails = parsedEpisodeDetails.filter(
            (obj) =>
              obj.name.toLowerCase().search(`${searchText}`.toLowerCase()) != -1 ||
              obj.episode_number == searchText,
          );
          for (const episodeData of fparsedEpisodeDetails) {
            let requiredFormat = {
              id: episodeData.id,
              draft_request_id: requestId,
              season_id: seasonId,
              draft_season_id: draftSeasonId,
              draft_episode_id: value.dataValues.id ? value.dataValues.id : "",
              episode_title: episodeData.name,
              episode_url: episodeData.url,
              episode_number: episodeData.episode_number,
              episode_date: episodeData.release_date,
              episode_image: episodeData.poster,
            };
            data.push(requiredFormat);
          }
        } else if (parsedEpisodeDetails && parsedEpisodeDetails != "") {
          for (const episodeData of parsedEpisodeDetails) {
            let requiredFormat = {
              id: episodeData.id,
              draft_request_id: requestId,
              season_id: seasonId,
              draft_season_id: draftSeasonId,
              draft_episode_id: value.dataValues.id,
              episode_title: episodeData.name,
              episode_url: episodeData.url,
              episode_number: episodeData.episode_number,
              episode_date: episodeData.release_date,
              episode_image: episodeData.poster,
            };
            data.push(requiredFormat);
          }
        }
      }
    } else if (findAllSeasonDetails) {
      if (findAllSeasonDetails.season_id) {
        let editIncludeQuery = [
          {
            model: model.episodeTranslation,
            attributes: ["name", "url", "site_language"],
            where: {
              site_language: siteLanguage,
              status: "active",
            },
            left: true,
            separate: true,
          },
        ];
        let editCondition = {};
        let episodeResultData = [];
        const editAttributes = [
          "id",
          "poster",
          "release_date",
          "season_number",
          "episode_number",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
        ];

        editCondition = {
          title_id: titleId,
          season_id: findAllSeasonDetails.season_id,
          status: "active",
        };

        episodeResultData = await model.episode.findAll({
          attributes: editAttributes,
          where: editCondition,
          include: editIncludeQuery,
        });
        let episodeFullList = [];
        if (episodeResultData && episodeResultData.length > 0) {
          for (const value of episodeResultData) {
            const element = {
              id: value && value.dataValues && value.dataValues.id ? value.dataValues.id : "",
              name:
                value &&
                value.episodeTranslations &&
                value.episodeTranslations[0] &&
                value.episodeTranslations[0].dataValues &&
                value.episodeTranslations[0].dataValues.name
                  ? value.episodeTranslations[0].dataValues.name
                  : "",
              url:
                value &&
                value.episodeTranslations &&
                value.episodeTranslations[0] &&
                value.episodeTranslations[0].dataValues &&
                value.episodeTranslations[0].dataValues.url
                  ? value.episodeTranslations[0].dataValues.url
                  : "",
              poster:
                value && value.dataValues && value.dataValues.path ? value.dataValues.path : "",
              release_date:
                value && value.dataValues && value.dataValues.release_date
                  ? value.dataValues.release_date
                  : "",
              episode_number:
                value && value.dataValues && value.dataValues.episode_number
                  ? value.dataValues.episode_number
                  : "",
            };
            episodeFullList.push(element);
          }
        }
        if (episodeFullList.length > 0) {
          const filterValue = episodeFullList.filter(
            (obj) =>
              obj.name.toLowerCase().search(`${searchText}`.toLowerCase()) != -1 ||
              obj.episode_number == searchText,
          );
          if (filterValue) {
            for (const value of filterValue) {
              if (value) {
                let requiredFormat = {
                  id: value.id ? value.id : "",
                  title_id: titleId,
                  season_id: findAllSeasonDetails.season_id
                    ? findAllSeasonDetails.season_id
                    : seasonId,
                  draft_season_id: draftSeasonId,
                  draft_episode_id: "",
                  episode_title: value.name ? value.name : "",
                  episode_url: value.url ? value.url : "",
                  episode_number: value.episode_number ? value.episode_number : "",
                  episode_date: value.release_date ? value.release_date : "",
                  episode_image: value.poster ? value.poster : "",
                };
                data.push(requiredFormat);
              }
            }
          }
        }
      }
    } else if (titleId) {
      let editIncludeQuery = [
        {
          model: model.episodeTranslation,
          attributes: ["name", "url", "site_language"],
          where: {
            site_language: siteLanguage,
            status: "active",
          },
          left: true,
          separate: true,
        },
      ];
      let editCondition = {};
      let episodeResultData = [];
      const editAttributes = [
        "id",
        "poster",
        "release_date",
        "season_number",
        "episode_number",
        [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
      ];

      editCondition = {
        title_id: titleId,
        season_id: seasonId,
        status: "active",
      };

      episodeResultData = await model.episode.findAll({
        attributes: editAttributes,
        where: editCondition,
        include: editIncludeQuery,
      });
      let episodeFullList = [];
      if (episodeResultData && episodeResultData.length > 0) {
        for (const value of episodeResultData) {
          const element = {
            id: value && value.dataValues && value.dataValues.id ? value.dataValues.id : "",
            name:
              value &&
              value.episodeTranslations &&
              value.episodeTranslations[0] &&
              value.episodeTranslations[0].dataValues &&
              value.episodeTranslations[0].dataValues.name
                ? value.episodeTranslations[0].dataValues.name
                : "",
            url:
              value &&
              value.episodeTranslations &&
              value.episodeTranslations[0] &&
              value.episodeTranslations[0].dataValues &&
              value.episodeTranslations[0].dataValues.url
                ? value.episodeTranslations[0].dataValues.url
                : "",
            poster: value && value.dataValues && value.dataValues.path ? value.dataValues.path : "",
            release_date:
              value && value.dataValues && value.dataValues.release_date
                ? value.dataValues.release_date
                : "",
            episode_number:
              value && value.dataValues && value.dataValues.episode_number
                ? value.dataValues.episode_number
                : "",
          };
          episodeFullList.push(element);
        }
      }
      if (episodeFullList.length > 0) {
        const filterValue = episodeFullList.filter(
          (obj) =>
            obj.name.toLowerCase().search(`${searchText}`.toLowerCase()) != -1 ||
            obj.episode_number == searchText,
        );
        if (filterValue) {
          for (const value of filterValue) {
            if (value) {
              let requiredFormat = {
                id: value.id ? value.id : "",
                title_id: titleId,
                season_id: seasonId,
                draft_request_id: "",
                draft_episode_id: "",
                draft_season_id: draftSeasonId,
                episode_title: value.name ? value.name : "",
                episode_url: value.url ? value.url : "",
                episode_number: value.episode_number ? value.episode_number : "",
                episode_date: value.release_date ? value.release_date : "",
                episode_image: value.poster ? value.poster : "",
              };
              data.push(requiredFormat);
            }
          }
        }
      }
    }
    res.ok({ draft_relation_id: relationId, results: data });
  } catch (error) {
    next(error);
  }
};
