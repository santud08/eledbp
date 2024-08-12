import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { titleRequestService } from "../../../services/index.js";

/**
 * editSaveEpisodeDetails
 * @param req
 * @param res
 */
export const editSaveEpisodeDetails = async (req, res, next) => {
  try {
    let data = {};
    let findEpisodeId = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const titleId = req.body.title_id;
    const titleType = "tv";
    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const draftRequestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const seasonPkId = req.body.season_id ? req.body.season_id : "";

    const siteLanguage = req.body.site_language;
    const episodeId = req.body.draft_episode_id ? req.body.draft_episode_id : "";

    let episodeList = [];
    // check for request id present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: draftRequestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
        type: "tv",
      },
    });
    // creating Request id and season request Id before add or edit the season details
    // 1. Create RequestID
    let newRequestId = [];
    if (!findRequestId) {
      //create request id
      newRequestId = await titleRequestService.createRequestIdForTv(
        titleId,
        userId,
        siteLanguage,
        titleType,
        draftRequestId,
      );
    }
    if (newRequestId.length > 0) {
      for (const value of newRequestId) {
        if (value && value.draft_site_language == siteLanguage) {
          data.request_id = value.draft_request_id;
        }
      }
    } else {
      data.request_id = draftRequestId;
    }

    // checking whether episode Id is already present for that request id and season Id
    let seasonId = "";
    if (draftSeasonId) {
      findEpisodeId = await model.titleRequestEpisodeDetails.findOne({
        where: {
          request_id: data.request_id,
          request_season_id: draftSeasonId,
          status: "active",
        },
      });
      seasonId = draftSeasonId;
    } else if (seasonPkId) {
      findEpisodeId = await model.titleRequestEpisodeDetails.findOne({
        where: {
          request_id: data.request_id,
          season_id: seasonPkId,
          status: "active",
        },
      });
      seasonId = seasonPkId;
    }
    const episodeObjectLength = findEpisodeId ? Object.keys(findEpisodeId).length : 0;
    // Episode Id is not present for that request_id and season Id create the data else update the data
    if (seasonId != "" && episodeObjectLength == 0) {
      const sendUniqueList = [];
      // user episode_details
      for (const episode of req.body.episode_details) {
        if (sendUniqueList.length === 0 || sendUniqueList.indexOf(episode.episode_number) === -1) {
          sendUniqueList.push(episode.episode_number);
          if (episode.action_type != "d") {
            const element = {
              id: episode.id,
              name: episode.name ? episode.name.trim() : "",
              description: episode.description ? episode.description : "",
              poster: episode.poster ? episode.poster : "",
              release_date: episode.release_date ? episode.release_date : "",
              title_id: titleId,
              season_id: seasonId ? seasonId : "",
              season_number: "",
              episode_number: episode.episode_number ? episode.episode_number : "",
              allow_update: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              temp_id: "",
              tmdb_vote_count: "",
              tmdb_vote_average: "",
              local_vote_average: "",
              year: "",
              popularity: "",
              tmdb_id: "",
              rating_percent: "",
              site_language: siteLanguage,
              status: "",
              created_by: userId,
              updated_by: "",
            };
            episodeList.push(element);
          }
        }
      }
      data.episode_details = { list: episodeList };

      data.request_season_id = draftSeasonId ? draftSeasonId : null;
      data.season_id = seasonPkId ? seasonPkId : null;
      data.created_at = await customDateTimeHelper.getCurrentDateTime();
      data.created_by = userId;
      // creating Episode ID for the first time

      const createdEpisodeId = await model.titleRequestEpisodeDetails.create(data);
      // creating response
      const [episodeData, getRelationData] = await Promise.all([
        model.titleRequestEpisodeDetails.findAll({
          attributes: ["id", "request_id", "request_season_id", "season_id"],
          where: {
            request_id: createdEpisodeId.request_id,
            status: "active",
          },
        }),
        model.titleRequestPrimaryDetails.findOne({
          where: {
            id: data.request_id,
            site_language: siteLanguage,
            request_status: "draft",
          },
        }),
      ]);
      let responseDetails = [];
      for (let element of episodeData) {
        let requiredFormat = {
          draft_relation_id:
            getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
          draft_request_id: element.request_id,
          draft_season_id: element.request_season_id,
          season_id: element.season_id,
          draft_episode_id: element.id,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    } else if (episodeObjectLength > 0) {
      //  finding Episode ID and then adding details to its existing list
      if (episodeId === findEpisodeId.id) {
        const parsedObject =
          findEpisodeId.episode_details != null && findEpisodeId.episode_details
            ? JSON.parse(findEpisodeId.episode_details)
            : null;
        episodeList = parsedObject != null ? parsedObject.list : [];

        // user episode_details for edit and delete
        let epIndex = 0;
        for (const episode of req.body.episode_details) {
          const element = {
            id: episode.id,
            name: episode.name ? episode.name.trim() : "",
            description: episode.description ? episode.description : "",
            poster: episode.poster ? episode.poster : "",
            release_date: episode.release_date ? episode.release_date : "",
            title_id: titleId,
            season_id: seasonId ? seasonId : "",
            season_number: "",
            episode_number: episode.episode_number ? episode.episode_number : "",
            allow_update: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            temp_id: "",
            tmdb_vote_count: "",
            tmdb_vote_average: "",
            local_vote_average: "",
            year: "",
            popularity: "",
            tmdb_id: "",
            rating_percent: "",
            site_language: siteLanguage,
            status: "",
            created_by: userId,
            updated_by: "",
          };

          // Action = Append
          if (episode.action_type === "a" && parsedObject != null) {
            episodeList.push(element);
          }
          // Action = Edit
          if (episode.action_type === "e" && parsedObject != null) {
            const foundIndex = episodeList.findIndex(
              (e) => e.episode_number === episode.episode_number,
            );
            // episodeList[foundIndex] = element;
            if (foundIndex >= 0) {
              episodeList[foundIndex] = element;
            } else {
              if (episode.id) {
                const foundIdIndex = episodeList.findIndex((e) => e.id === episode.id);
                episodeList[foundIdIndex] = element;
              } else {
                episodeList[epIndex] = element;
              }
            }
          }
          // Action = Delete
          if (episode.action_type === "d" && parsedObject != null) {
            const foundIndex = episodeList.findIndex(
              (d) => d.episode_number === episode.episode_number,
            );
            episodeList.splice(foundIndex, 1);
          }
          epIndex += 1;
        }
        data.episode_details = { list: episodeList };

        data.request_season_id = draftSeasonId ? draftSeasonId : null;
        data.season_id = seasonPkId ? seasonPkId : null;
        data.updated_at = await customDateTimeHelper.getCurrentDateTime();
        data.updated_by = userId;
        // // updating the Episode list and

        await model.titleRequestEpisodeDetails.update(data, {
          where: {
            id: episodeId,
            request_id: data.request_id,
            status: "active",
          },
        });
        // creating response
        const [updatedEpisode, getRelationData] = await Promise.all([
          model.titleRequestEpisodeDetails.findAll({
            where: { id: episodeId, status: "active" },
          }),
          model.titleRequestPrimaryDetails.findOne({
            where: {
              id: data.request_id,
              site_language: siteLanguage,
              request_status: "draft",
            },
          }),
        ]);
        let responseDetails = [];
        for (let element of updatedEpisode) {
          let requiredFormat = {
            draft_relation_id:
              getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
            draft_request_id: element.request_id,
            draft_season_id: element.request_season_id,
            season_id: element.season_id,
            draft_episode_id: element.id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        throw StatusError.badRequest(res.__("Invalid Episode ID"));
      }
    } else {
      throw StatusError.badRequest(res.__("Invalid inputs"));
    }
  } catch (error) {
    console.log("error", error);
    next(error);
  }
};
