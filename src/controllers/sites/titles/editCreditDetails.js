import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { titleRequestService } from "../../../services/index.js";
/**
 * editCreditDetails
 * @param req
 * @param res
 */
export const editCreditDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    let titleId = req.body.title_id ? req.body.title_id : "";
    const creditId = req.body.draft_credit_id;
    const titleType = req.body.title_type;
    const siteLanguage = req.body.site_language;

    const draftSeasonId = req.body.draft_season_id ? req.body.draft_season_id : "";
    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";

    const seasonPkId = titleType == "tv" ? req.body.season_id : null;

    const titleData = await model.title.findOne({
      where: { id: titleId, record_status: "active" },
    });

    if (!titleData) throw StatusError.badRequest(res.__("Invalid Title Id"));

    // Check for request ID
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: requestId,
        status: "active",
        request_status: "draft",
        site_language: siteLanguage,
      },
    });

    let newRequestId = [];
    if (!findRequestId && titleType == "movie") {
      //create request id
      newRequestId = await titleRequestService.createRequestIdForMovie(
        titleId,
        userId,
        siteLanguage,
        titleType,
        requestId,
      );
    } else if (!findRequestId && titleType == "tv") {
      //create request id
      newRequestId = await titleRequestService.createRequestIdForTv(
        titleId,
        userId,
        siteLanguage,
        titleType,
        requestId,
      );
    }

    if (newRequestId.length > 0) {
      for (const value of newRequestId) {
        if (value && value.draft_site_language == siteLanguage) {
          data.request_id = value.draft_request_id;
        }
      }
    } else {
      data.request_id = requestId;
    }

    // Credit Id is not present for that request_id create the data else update the data

    if (titleType === "movie") {
      // user cast_list
      let castList = [];
      if (req.body.cast_details) {
        for (const cast of req.body.cast_details) {
          const element = {
            id: cast.id,
            people_id: cast.people_id,
            creditable_id: titleId,
            character_name: cast.character_name ? cast.character_name.trim() : null,
            cast_name: !cast.people_id && cast.cast_name ? cast.cast_name.trim() : null,
            poster: cast.poster ? cast.poster : null,
            list_order: cast.order,
            department: "cast",
            job: cast.job,
            creditable_type: "title",
            is_guest: cast.is_guest ? cast.is_guest : 0,
            season_id: "",
            episode_id: "",
            site_language: siteLanguage,
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
            tmdb_id: cast.tmdb_id ? cast.tmdb_id : "",
          };
          castList.push(element);
        }
      }
      data.cast_details = { list: castList };
      // user crew_list
      let crewList = [];
      if (req.body.crew_details) {
        for (const crew of req.body.crew_details) {
          const element = {
            id: crew.id,
            people_id: crew.people_id,
            creditable_id: titleId,
            character_name: "",
            cast_name: !crew.people_id && crew.cast_name ? crew.cast_name.trim() : null,
            poster: crew.poster ? crew.poster : null,
            list_order: crew.order,
            department: "crew",
            job: crew.job,
            creditable_type: "title",
            is_guest: "",
            season_id: "",
            episode_id: "",
            site_language: siteLanguage,
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
            tmdb_id: crew.tmdb_id ? crew.tmdb_id : "",
          };
          crewList.push(element);
        }
      }
      data.crew_details = { list: crewList };

      // checking whether CreditId is already present for that request id
      const findCreditId = await model.titleRequestCredit.findOne({
        where: { request_id: data.request_id, status: "active" },
      });
      if (!findCreditId) {
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = userId;
        // creating credit ID for the first time

        const createdCreditId = await model.titleRequestCredit.create(data);
        // creating response
        // Get the relation Id
        const [creditData, getRelationData] = await Promise.all([
          model.titleRequestCredit.findAll({
            attributes: ["id", "request_id"],
            where: { id: createdCreditId.id },
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
        for (let element of creditData) {
          let requiredFormat = {
            draft_relation_id:
              getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
            draft_request_id: element.request_id,
            draft_credit_id: element.id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        //  finding credit ID and then adding credit to its existing list
        if (creditId === findCreditId.id) {
          data.updated_at = await customDateTimeHelper.getCurrentDateTime();
          data.updated_by = userId;
          // // updating the credit details
          await model.titleRequestCredit.update(data, {
            where: { id: creditId, request_id: data.request_id, status: "active" },
          });
          // creating response
          const [updatedCredit, getRelationData] = await Promise.all([
            model.titleRequestCredit.findAll({
              where: { id: creditId, status: "active" },
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
          for (let element of updatedCredit) {
            let requiredFormat = {
              draft_relation_id:
                getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
              draft_request_id: element.request_id,
              draft_credit_id: element.id,
            };
            responseDetails.push(requiredFormat);
          }
          res.ok({ data: responseDetails });
        } else {
          throw StatusError.badRequest(res.__("Invalid Credit ID"));
        }
      }
    }

    if (titleType === "tv") {
      let findCreditId = {};
      let seasonId = "";
      if (draftSeasonId) {
        findCreditId = await model.titleRequestCredit.findOne({
          where: {
            request_id: data.request_id,
            request_season_id: draftSeasonId,
            status: "active",
          },
        });
        seasonId = draftSeasonId;
      } else if (seasonPkId) {
        findCreditId = await model.titleRequestCredit.findOne({
          where: {
            request_id: data.request_id,
            season_id: seasonPkId,
            status: "active",
          },
        });
        seasonId = seasonPkId;
      }
      const creditObjectLength = findCreditId ? Object.keys(findCreditId).length : 0;
      if (seasonId != "" && creditObjectLength == 0) {
        let castList = [];
        let i = 1;
        for (const cast of req.body.cast_details) {
          if (cast.action_type != "d") {
            const element = {
              temp_id: i,
              id: cast.id,
              people_id: cast.people_id,
              creditable_id: titleId,
              character_name: cast.character_name ? cast.character_name.trim() : null,
              cast_name: !cast.people_id && cast.cast_name ? cast.cast_name.trim() : null,
              poster: cast.poster ? cast.poster : null,
              list_order: cast.order,
              department: "cast",
              job: cast.job,
              creditable_type: "title",
              is_guest: cast.is_guest ? cast.is_guest : 0,
              season_id: seasonId,
              episode_id: "",
              site_language: siteLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
              tmdb_id: cast.tmdb_id ? cast.tmdb_id : "",
            };
            castList.push(element);
            i += 1;
          }
        }
        data.cast_details = { list: castList };

        // user crew_list
        let crewList = [];
        let j = 1;
        for (const crew of req.body.crew_details) {
          if (crew.action_type != "d") {
            const element = {
              temp_id: j,
              id: crew.id,
              people_id: crew.people_id,
              creditable_id: titleId,
              character_name: "",
              cast_name: !crew.people_id && crew.cast_name ? crew.cast_name.trim() : null,
              poster: crew.poster ? crew.poster : null,
              list_order: crew.order,
              department: "crew",
              job: crew.job,
              creditable_type: "title",
              is_guest: "",
              season_id: seasonId,
              episode_id: "",
              site_language: siteLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
              tmdb_id: crew.tmdb_id ? crew.tmdb_id : "",
            };
            crewList.push(element);
            j += 1;
          }
        }
        data.crew_details = { list: crewList };

        data.request_season_id = draftSeasonId ? draftSeasonId : null;
        data.season_id = seasonPkId ? seasonPkId : null;
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = userId;
        // creating credit ID for the first time

        const createdCreditId = await model.titleRequestCredit.create(data);
        // creating response
        const [creditData, getRelationData] = await Promise.all([
          model.titleRequestCredit.findAll({
            attributes: ["id", "request_id", "request_season_id", "season_id"],
            where: { id: createdCreditId.id, status: "active" },
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
        for (let element of creditData) {
          let requiredFormat = {
            draft_relation_id:
              getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
            draft_request_id: element.request_id,
            draft_credit_id: element.id,
            draft_season_id: element.request_season_id,
            season_id: element.season_id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else if (creditObjectLength > 0) {
        // Update the current list
        //  finding credit ID and then adding credit to its existing list
        if (creditId === findCreditId.id) {
          // getting the cast details that are already saved
          const parsedObject =
            findCreditId.cast_details != null && findCreditId.cast_details
              ? JSON.parse(findCreditId.cast_details)
              : null;
          let castList = parsedObject != null ? parsedObject.list : [];
          for (const cast of req.body.cast_details) {
            const element = {
              id: cast.id,
              people_id: cast.people_id,
              creditable_id: titleId,
              character_name: cast.character_name ? cast.character_name.trim() : null,
              cast_name: !cast.people_id && cast.cast_name ? cast.cast_name.trim() : null,
              poster: cast.poster ? cast.poster : null,
              list_order: cast.order,
              department: "cast",
              job: cast.job,
              creditable_type: "title",
              is_guest: cast.is_guest ? cast.is_guest : 0,
              season_id: seasonId,
              episode_id: "",
              site_language: siteLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
              tmdb_id: cast.tmdb_id ? cast.tmdb_id : "",
            };
            // Action = Append
            if (cast.action_type === "a" && parsedObject != null) {
              // get the max temp_id value - needed only when new object is inserted.
              const maxTempId =
                castList.length > 0 ? Math.max(...castList.map((maxValue) => maxValue.temp_id)) : 0;
              element.temp_id = maxTempId + 1;
              castList.push(element);
            }
            // Action = Edit
            if (cast.action_type === "e" && parsedObject != null && cast.people_id != "") {
              element.temp_id = cast.temp_id;
              const foundIndex = castList.findIndex(
                (e) => cast.people_id != "" && e.temp_id === cast.temp_id,
              );
              castList[foundIndex] = element;
            }
            // Action = Delete
            if (cast.action_type === "d" && parsedObject != null && cast.people_id != "") {
              const foundIndex = castList.findIndex(
                (d) => cast.people_id != "" && d.temp_id === cast.temp_id,
              );
              castList.splice(foundIndex, 1);
            }

            // Action =edit without people_id
            if (cast.action_type === "e" && parsedObject != null && cast.people_id === "") {
              element.temp_id = cast.temp_id;
              const foundIndexNoId = castList.findIndex(
                (e) => e.people_id === "" && e.temp_id === cast.temp_id,
              );
              castList[foundIndexNoId] = element;
            }
            // Action = Delete without people_id
            if (cast.action_type === "d" && parsedObject != null && cast.people_id === "") {
              const foundIndexNoId = castList.findIndex(
                (d) => d.people_id === "" && d.temp_id === cast.temp_id,
              );
              castList.splice(foundIndexNoId, 1);
            }
          }
          data.cast_details = { list: castList };

          // user crew_list
          // getting the crew details that are already saved
          const parsedCrewObject =
            findCreditId.crew_details != null && findCreditId.crew_details
              ? JSON.parse(findCreditId.crew_details)
              : null;
          let crewList = parsedCrewObject != null ? parsedCrewObject.list : [];
          for (const crew of req.body.crew_details) {
            const element = {
              id: crew.id,
              people_id: crew.people_id,
              creditable_id: titleId,
              character_name: "",
              cast_name: !crew.people_id && crew.cast_name ? crew.cast_name.trim() : null,
              poster: crew.poster ? crew.poster : null,
              list_order: crew.order,
              department: "crew",
              job: crew.job,
              creditable_type: "title",
              is_guest: "",
              season_id: seasonId,
              episode_id: "",
              site_language: siteLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
              tmdb_id: crew.tmdb_id ? crew.tmdb_id : "",
            };
            // Action = Append
            if (crew.action_type === "a" && parsedCrewObject != null) {
              const maxTempId =
                crewList.length > 0 ? Math.max(...crewList.map((maxValue) => maxValue.temp_id)) : 0;
              element.temp_id = maxTempId + 1;
              crewList.push(element);
            }
            // Action = Edit
            if (crew.action_type === "e" && parsedCrewObject != null && crew.people_id != "") {
              element.temp_id = crew.temp_id;
              const foundCrewIndex = crewList.findIndex(
                (e) => crew.people_id != "" && e.temp_id === crew.temp_id,
              );
              crewList[foundCrewIndex] = element;
            }
            // Action = Delete
            if (crew.action_type === "d" && parsedCrewObject != null && crew.people_id != "") {
              const foundCrewIndex = crewList.findIndex(
                (d) => crew.people_id != "" && d.temp_id === crew.temp_id,
              );
              crewList.splice(foundCrewIndex, 1);
            }
            // Action =edit without people_id
            if (crew.action_type === "e" && parsedObject != null && crew.people_id === "") {
              element.temp_id = crew.temp_id;
              const foundCrewIndex = crewList.findIndex(
                (e) => e.people_id === "" && e.temp_id === crew.temp_id,
              );
              crewList[foundCrewIndex] = element;
            }
            // Action = Delete without people_id
            if (crew.action_type === "d" && parsedObject != null && crew.people_id === "") {
              const foundCrewIndex = crewList.findIndex(
                (d) => d.people_id === "" && d.temp_id === crew.temp_id,
              );
              crewList.splice(foundCrewIndex, 1);
            }
          }
          data.crew_details = { list: crewList };

          data.updated_at = await customDateTimeHelper.getCurrentDateTime();
          data.updated_by = userId;
          // // updating the video list and
          await model.titleRequestCredit.update(data, {
            where: {
              id: creditId,
              request_id: data.request_id,
              status: "active",
            },
          });
          // creating response
          const [updatedCredit, getRelationData] = await Promise.all([
            await model.titleRequestCredit.findAll({
              where: { id: creditId, status: "active" },
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
          for (let element of updatedCredit) {
            let requiredFormat = {
              draft_relation_id:
                getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "",
              draft_request_id: element.request_id,
              draft_credit_id: element.id,
              draft_season_id: element.request_season_id,
              season_id: element.season_id,
            };
            responseDetails.push(requiredFormat);
          }
          res.ok({ data: responseDetails });
        } else {
          throw StatusError.badRequest(res.__("Invalid Credit ID"));
        }
      } else {
        throw StatusError.badRequest(res.__("Invalid inputs"));
      }
    }
  } catch (error) {
    next(error);
  }
};
