import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * addEpisodeDetails
 * @param req
 * @param res
 */
export const editAddEpisodeDetails = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const draftRequestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const date = req.body.date ? req.body.date : null;
    const siteLanguage = req.body.site_language;
    const seasonId = req.body.season_id ? req.body.season_id : "";
    const episodeId = req.body.episode_id ? req.body.episode_id : "";
    const draftEpisodeId = req.body.draft_episode_id ? req.body.draft_episode_id : "";
    const titleId = req.body.title_id;
    const titleType = req.body.type ? req.body.type : "tv";

    let data = {};
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    data.title_id = titleId;
    data.draft_request_id = draftRequestId;
    data.draft_season_id = draftSeasonId;
    data.draft_episode_id = draftEpisodeId;
    data.season_id = seasonId;
    data.episode_id = episodeId;
    data.episode_number = req.body.episode_no;
    data.name = req.body.episode_title;
    data.description = req.body.overview ? req.body.overview : null;
    data.poster_path = req.file && req.file.path ? req.file.path : ""; // path is not found in s3
    data.poster_size = req.file && req.file.size ? req.file.size : "";
    data.poster_mime_type = req.file && req.file.mimetype ? req.file.mimetype : "";
    data.poster_location = req.file && req.file.location ? req.file.location : "";
    data.release_date = date != null ? date.toISOString().split("T")[0] : null;
    data.site_language = siteLanguage;

    if (titleType == "webtoons") data.url = req.body.url ? req.body.url : null;

    res.ok({ episode_details: data });
  } catch (error) {
    next(error);
  }
};
