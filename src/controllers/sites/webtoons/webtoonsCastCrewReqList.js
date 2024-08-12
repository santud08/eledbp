import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * webtoonsCastCrewReqList
 * @param req
 * @param res
 */
export const webtoonsCastCrewReqList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id;
    const siteLanguage = req.body.site_language ? req.body.site_language : "en";
    const titleType = "webtoons";
    const seasonId = req.body.season_id;
    const creditType = req.body.credit_type;

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        type: titleType,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    if (!findRequestId) throw StatusError.badRequest(res.__("Invalid Request ID"));

    const findCreditId = await model.titleRequestCredit.findOne({
      where: {
        request_id: requestId,
        status: "active",
        request_season_id: seasonId,
      },
    });

    // getting data for people_id from people and people translation table
    let peopleResult = [];

    // NOTE::: for webtoons castList is characterList <------------------

    // Fetching the list of cast and crew details
    if (findCreditId && findCreditId != null) {
      const castList =
        findCreditId.cast_details != null ? JSON.parse(findCreditId.cast_details) : null;
      const crewList =
        findCreditId.crew_details != null ? JSON.parse(findCreditId.crew_details) : null;
      // Fetch only when both RequestID and CreditID data is present
      let responseDetails = [];
      if (creditType === "character" && castList != null) {
        // Loop through the list of cast details - character details of webtoons
        for (const castDetails of castList.list) {
          if (castDetails.season_id === seasonId && castDetails.department === "character") {
            // Presence of season ID means its a Webtoons request - Cast details
            let data = {
              temp_id: castDetails.temp_id,
              people_id: castDetails.people_id,
              character_name: castDetails.character_name,
              description: castDetails.description ? castDetails.description : "",
              is_guest: castDetails.is_guest,
              poster: castDetails.poster,
              season_id: castDetails.season_id,
              order: castDetails.list_order,
            };
            responseDetails.push(data);
          }
        }
        res.ok({
          draft_request_id: requestId,
          draft_credit_id: findCreditId.id,
          character_details:
            responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
        });
      } else if (creditType === "crew" && crewList != null) {
        // Loop through the list of crew details
        for (const crewDetails of crewList.list) {
          if (crewDetails.season_id === seasonId && crewDetails.department === "crew") {
            // Presence of season ID means its a TV request - Crew details
            if (crewDetails.people_id === "" || crewDetails.people_id === null) {
              // People ID empty or null means that the cast is newly added and not in our DB
              let data = {
                temp_id: crewDetails.temp_id,
                people_id: crewDetails.people_id,
                cast_name: crewDetails.cast_name,
                job: crewDetails.job,
                season_id: crewDetails.season_id,
                poster: crewDetails.poster,
                order: crewDetails.list_order,
              };
              responseDetails.push(data);
            } else {
              // People ID already present - Fetch the ID, name and Poster details from People and People translation table
              peopleResult = await model.people.findAll({
                attributes: ["id", "poster"],
                where: { id: crewDetails.people_id, status: "active" },
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["people_id", "name", "site_language"],
                    left: true,
                    where: {
                      status: "active",
                    },
                    required: false,
                    separate: true,
                    order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                  },
                ],
              });
              for (let element of peopleResult) {
                let data = {
                  temp_id: crewDetails.temp_id,
                  people_id: element.id,
                  cast_name:
                    element.peopleTranslations && element.peopleTranslations[0]
                      ? element.peopleTranslations[0].name
                      : "",
                  job: crewDetails.job,
                  poster: crewDetails.poster
                    ? crewDetails.poster
                    : element.poster
                    ? element.poster
                    : "",
                  season_id: crewDetails.season_id,
                  order: crewDetails.list_order,
                };
                responseDetails.push(data);
              }
            }
          }
        }
        res.ok({
          draft_request_id: requestId,
          draft_credit_id: findCreditId.id,
          crew_details:
            responseDetails.length > 0 ? responseDetails.sort((a, b) => a.order - b.order) : [],
        });
      } else {
        res.ok({ draft_request_id: requestId, draft_credit_id: findCreditId.id, result: [] });
      }
    } else {
      res.ok({ draft_request_id: requestId, result: [] });
    }
  } catch (error) {
    next(error);
  }
};
