import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * getWebtoonsEpisodeDetails
 * @param req
 * @param res
 */
export const getWebtoonsEpisodeDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid request id"));
    }
    if (!reqBody.episode_number && reqBody.episode_number == "undefined") {
      throw StatusError.badRequest(res.__("Invalid episode number"));
    }
    const requestId = reqBody.id; //It will be request id
    const episodeId = req.query.episode_id; //It will be episode id
    const episodeNumber = req.query.episode_number; //It will be episode number
    const language = req.query.language ? req.query.language : "en";

    const titleType = "webtoons";
    let getEpisode = [];

    // Check for request details
    const getRequestInformations = await model.titleRequestPrimaryDetails.findOne({
      attributes: ["id", "name"],
      where: { id: requestId, type: titleType, site_language: language, record_status: "active" },
    });
    if (!getRequestInformations) throw StatusError.badRequest(res.__("Invalid request id"));

    // Check for episode details
    let getEpisodeInformations = {};
    if (episodeId) {
      getEpisodeInformations = await model.titleRequestEpisodeDetails.findOne({
        attributes: ["id", "episode_details"],
        where: { id: episodeId, status: "active" },
      });
      if (!getEpisodeInformations) throw StatusError.badRequest(res.__("Invalid Episode ID"));
    }

    let list = [];
    if (getEpisodeInformations.episode_details) {
      // Get Episode details
      const getEpisodeDetails = JSON.parse(getEpisodeInformations.episode_details);
      for (const episode of getEpisodeDetails.list) {
        if (episode && episode.episode_number == episodeNumber) {
          const episodeNumber = episode.episode_number ? episode.episode_number : "";
          const episodeTitle = episode.name ? episode.name : "";
          const image = episode.poster ? episode.poster : "";
          const date = episode.release_date ? episode.release_date : "";
          const url = episode.url ? episode.url : "";
          const record = {
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

    res.ok({
      request_id: requestId,
      result: getEpisode,
    });
  } catch (error) {
    next(error);
  }
};
