import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * addEpisodeDetails
 * @param req
 * @param res
 */
export const addEpisodeDetails = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const draftRequestId = req.body.draft_request_id;
    const date = req.body.date ? req.body.date : null;
    const siteLanguage = req.body.site_language;
    const seasonId = req.body.draft_season_id;
    const titleType = req.body.type ? req.body.type : "tv";

    let data = {};
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    // check for request id present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: draftRequestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
        type: titleType,
      },
    });
    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    // check for season id present for that title request

    const findSeasonRequest = await model.titleRequestSeasonDetails.findOne({
      where: {
        id: seasonId,
        request_id: draftRequestId,
        status: "active",
      },
    });

    if (!findSeasonRequest) throw StatusError.badRequest(res.__("Invalid Season ID"));
    if (findSeasonRequest) {
      data.draft_request_id = draftRequestId;
      data.name = req.body.episode_title;
      data.description = req.body.overview ? req.body.overview : null;
      data.poster_path = req.file && req.file.path ? req.file.path : ""; // path is not found in s3
      data.poster_size = req.file && req.file.size ? req.file.size : "";
      data.poster_mime_type = req.file && req.file.mimetype ? req.file.mimetype : "";
      data.poster_location = req.file && req.file.location ? req.file.location : "";
      data.release_date =
        date != null ? await customDateTimeHelper.changeDateFormat(date, "YYYY-MM-DD") : null;
      data.season_id = seasonId;
      data.episode_number = req.body.episode_no;
      data.site_language = findRequestId.site_language;
    }
    if (titleType == "webtoons") data.url = req.body.url ? req.body.url : null;

    res.ok({ episode_details: data });
  } catch (error) {
    next(error);
  }
};
