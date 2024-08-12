import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * getEditWtRequestEpisodeDetails
 * @param req
 * @param res
 */
export const getEditWtRequestEpisodeDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;

    const titleId = reqBody.title_id; //It will be title id
    const seasonId = reqBody.season_id ? reqBody.season_id : ""; //It will be season id
    const requestId = reqBody.request_id ? reqBody.request_id : ""; //It will be request id
    const draftSeasonId = reqBody.draft_season_id ? reqBody.draft_season_id : ""; //It will be draft_season_id
    const episodeId = reqBody.episode_id ? reqBody.episode_id : ""; //It will be episode id
    const draftEpisodeId = reqBody.draft_episode_id ? reqBody.draft_episode_id : ""; //It will be draft_episode id
    const episodeNumber = reqBody.episode_number; //It will be episode number
    const language = reqBody.language;
    const titleType = "webtoons";
    let getEpisode = [];

    // if request id exist
    if (requestId && draftEpisodeId) {
      const getRequestInformations = await model.titleRequestPrimaryDetails.findOne({
        attributes: ["id", "name"],
        where: { id: requestId, type: titleType, site_language: language, record_status: "active" },
      });

      if (!getRequestInformations) throw StatusError.badRequest(res.__("Invalid request id"));

      const getEpisodeInformations = await model.titleRequestEpisodeDetails.findOne({
        attributes: ["id", "episode_details"],
        where: { request_id: requestId, id: draftEpisodeId, status: "active" },
      });

      if (!getEpisodeInformations) throw StatusError.badRequest(res.__("Invalid Episode ID"));

      // Get Episode details
      const getEpisodeDetails = JSON.parse(getEpisodeInformations.episode_details);
      if (getEpisodeDetails) {
        let list = [];
        for (const episode of getEpisodeDetails.list) {
          if (episode && episode.episode_number == episodeNumber) {
            const episodeNumber = episode.episode_number ? episode.episode_number : "";
            const episodeTitle = episode.name ? episode.name : "";
            const image = episode.poster ? episode.poster : "";
            const date = episode.release_date ? episode.release_date : "";
            const url = episode.url ? episode.url : "";
            const episodeId = episode.id ? episode.id : "";
            const record = {
              episode_id: episodeId,
              episode_no: episodeNumber,
              episode_title: episodeTitle,
              image: image,
              date: date,
              url: url,
            };
            list.push(record);
          }
          getEpisode = list;
        }
      }
    } else {
      const getEpisodeInformations = await model.episode.findOne({
        attributes: ["id", "poster", "release_date", "season_number", "episode_number"],
        where: {
          title_id: titleId,
          season_id: seasonId,
          id: episodeId,
          status: "active",
        },
        include: [
          {
            attributes: ["name", "url"],
            model: model.episodeTranslation,
            where: {
              site_language: language,
              status: "active",
            },
            left: true,
            required: false,
          },
        ],
      });
      const episodeTitle =
        getEpisodeInformations &&
        getEpisodeInformations.episodeTranslations &&
        getEpisodeInformations.episodeTranslations.length > 0 &&
        getEpisodeInformations.episodeTranslations[0].name
          ? getEpisodeInformations.episodeTranslations[0].name
          : "";
      const episodeUrl =
        getEpisodeInformations &&
        getEpisodeInformations.episodeTranslations &&
        getEpisodeInformations.episodeTranslations.length > 0 &&
        getEpisodeInformations.episodeTranslations[0].url
          ? getEpisodeInformations.episodeTranslations[0].url
          : "";
      const record = {
        episode_id:
          getEpisodeInformations && getEpisodeInformations.id ? getEpisodeInformations.id : "",
        episode_no:
          getEpisodeInformations && getEpisodeInformations.episode_number
            ? getEpisodeInformations.episode_number
            : "",
        episode_title: episodeTitle,
        image:
          getEpisodeInformations && getEpisodeInformations.poster
            ? getEpisodeInformations.poster
            : "",
        date:
          getEpisodeInformations && getEpisodeInformations.release_date
            ? getEpisodeInformations.release_date
            : "",
        url: episodeUrl,
      };
      getEpisode.push(record);
    }

    res.ok({
      title_id: titleId,
      request_id: requestId,
      draft_season_id: draftSeasonId,
      season_id: seasonId,
      episode_id: episodeId,
      draft_episode_id: draftEpisodeId,
      result: getEpisode,
    });
  } catch (error) {
    next(error);
  }
};
