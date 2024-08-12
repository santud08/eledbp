import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * webtoonsSaveEpisodeDetails
 * @param req
 * @param res
 */
export const webtoonsSaveEpisodeDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    data.request_id = req.body.draft_request_id;
    data.request_season_id = req.body.draft_season_id;
    const siteLanguage = req.body.site_language;
    const episodeId = req.body.draft_episode_id;

    let episodeList = [];
    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: data.request_id,
        type: "webtoons",
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });
    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    const relationId = findRequestId && findRequestId.relation_id ? findRequestId.relation_id : "";
    const otherLanguage = siteLanguage === "en" ? "ko" : "en";
    const findOtherLangRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        relation_id: relationId,
        status: "active",
        request_status: "draft",
        site_language: otherLanguage,
        type: "webtoons",
      },
    });
    const otherLangRequestId =
      findOtherLangRequestId && findOtherLangRequestId.id ? findOtherLangRequestId.id : "";

    // check for season id present for that title request
    const findSeasonRequest = await model.titleRequestSeasonDetails.findOne({
      where: {
        id: data.request_season_id,
        request_id: data.request_id,
        status: "active",
      },
    });
    if (!findSeasonRequest) throw StatusError.badRequest(res.__("Invalid Season ID"));

    // find other language season Request ID
    const seasonNo =
      findSeasonRequest && findSeasonRequest.season_no
        ? findSeasonRequest.season_no
        : findSeasonRequest.season_no == 0
        ? 0
        : false;
    const findOtherLangSeasonRequest = await model.titleRequestSeasonDetails.findOne({
      where: {
        season_no: seasonNo,
        request_id: otherLangRequestId,
        status: "active",
      },
    });
    const otherLangSeasonReqId =
      findOtherLangSeasonRequest && findOtherLangSeasonRequest.id
        ? findOtherLangSeasonRequest.id
        : "";
    // checking whether episode Id is already present for that request id and season Id
    let findEpisodeId = await model.titleRequestEpisodeDetails.findOne({
      where: {
        request_id: data.request_id,
        request_season_id: data.request_season_id,
        status: "active",
      },
    });
    // Episode Id is not present for that request_id and season Id create the data else update the data
    if (!findEpisodeId) {
      const sendUniqueList = [];
      // user episode_details
      for (const episode of req.body.episode_details) {
        if (sendUniqueList.length === 0 || sendUniqueList.indexOf(episode.episode_number) === -1) {
          sendUniqueList.push(episode.episode_number);
          const element = {
            id: "",
            name: episode.name ? episode.name.trim() : "",
            description: "",
            url: episode.url ? episode.url : "",
            poster: episode.poster ? episode.poster : "",
            release_date: episode.release_date ? episode.release_date : "",
            title_id: "",
            season_id: data.request_season_id ? data.request_season_id : "",
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
      data.episode_details = { list: episodeList };

      data.created_at = await customDateTimeHelper.getCurrentDateTime();
      data.created_by = userId;
      // creating Episode ID for the first time
      const createdEpisodeId = await model.titleRequestEpisodeDetails.create(data);

      // creating episode data for other language
      if (otherLangSeasonReqId) {
        const sendUniqueListOtherLang = [];
        const episodeListOtherLang = [];
        data.request_id = otherLangRequestId;
        data.request_season_id = otherLangSeasonReqId;
        for (const episode of req.body.episode_details) {
          if (
            sendUniqueListOtherLang.length === 0 ||
            sendUniqueListOtherLang.indexOf(episode.episode_number) === -1
          ) {
            sendUniqueListOtherLang.push(episode.episode_number);
            const element = {
              id: "",
              name: episode.name ? episode.name.trim() : "",
              description: "",
              url: episode.url ? episode.url : "",
              poster: episode.poster ? episode.poster : "",
              release_date: episode.release_date ? episode.release_date : "",
              title_id: "",
              season_id: data.request_season_id ? data.request_season_id : "",
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
              site_language: otherLanguage,
              status: "",
              created_by: userId,
              updated_by: "",
            };
            episodeListOtherLang.push(element);
          }
        }
        data.episode_details = { list: episodeListOtherLang };
        await model.titleRequestEpisodeDetails.create(data);
      }
      // creating response
      const episodeData = await model.titleRequestEpisodeDetails.findAll({
        attributes: ["id", "request_id", "request_season_id"],
        where: {
          request_id: createdEpisodeId.request_id,
          status: "active",
        },
      });
      let responseDetails = [];
      for (let element of episodeData) {
        let requiredFormat = {
          draft_request_id: element.request_id,
          draft_season_id: element.request_season_id,
          draft_episode_id: element.id,
        };
        responseDetails.push(requiredFormat);
      }
      res.ok({ data: responseDetails });
    } else {
      //  finding Episode ID and then adding details to its existing list
      if (episodeId === findEpisodeId.id) {
        const parsedObject =
          findEpisodeId.episode_details != null && findEpisodeId.episode_details
            ? JSON.parse(findEpisodeId.episode_details)
            : null;
        episodeList = parsedObject != null ? parsedObject.list : [];

        // filtering the dupicate object by checking with episode_number
        const resultArrayObj = req.body.episode_details.filter(
          (a) => !episodeList.some((b) => a.episode_number === b.episode_number),
        );
        // Action = Append- based  on the resultArr
        for (const appendData of resultArrayObj) {
          if (appendData.action_type === "a" && parsedObject != null) {
            const appendElement = {
              id: "",
              name: appendData.name ? appendData.name.trim() : "",
              description: "",
              url: appendData.url ? appendData.url : "",
              poster: appendData.poster ? appendData.poster : "",
              release_date: appendData.release_date ? appendData.release_date : "",
              title_id: "",
              season_id: data.request_season_id ? data.request_season_id : "",
              season_number: "",
              episode_number: appendData.episode_number ? appendData.episode_number : "",
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
            episodeList.push(appendElement);
          }
        }
        // user episode_details for edit and delete
        let epIndex = 0;
        for (const episode of req.body.episode_details) {
          const element = {
            id: "",
            name: episode.name ? episode.name.trim() : "",
            description: "",
            url: episode.url ? episode.url : "",
            poster: episode.poster ? episode.poster : "",
            release_date: episode.release_date ? episode.release_date : "",
            title_id: "",
            season_id: data.request_season_id ? data.request_season_id : "",
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

          // Action = Edit
          if (episode.action_type === "e" && parsedObject != null) {
            const foundIndex = episodeList.findIndex(
              (e) => e.episode_number === episode.episode_number,
            );
            if (foundIndex >= 0) {
              episodeList[foundIndex] = element;
            } else {
              episodeList[epIndex] = element;
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
        data.updated_at = await customDateTimeHelper.getCurrentDateTime();
        data.updated_by = userId;
        // // updating the Episode list and

        await model.titleRequestEpisodeDetails.update(data, {
          where: {
            id: episodeId,
            request_id: data.request_id,
            request_season_id: data.request_season_id,
            status: "active",
          },
        });
        // creating response
        const updatedEpisode = await model.titleRequestEpisodeDetails.findAll({
          where: { id: episodeId, status: "active" },
        });
        let responseDetails = [];
        for (let element of updatedEpisode) {
          let requiredFormat = {
            draft_request_id: element.request_id,
            draft_season_id: element.request_season_id,
            draft_episode_id: element.id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        throw StatusError.badRequest(res.__("Invalid Episode ID"));
      }
    }
  } catch (error) {
    next(error);
  }
};
