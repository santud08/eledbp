import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * addCreditDetails
 * @param req
 * @param res
 */
export const addCreditDetails = async (req, res, next) => {
  try {
    let data = {};
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));
    data.request_id = req.body.draft_request_id;
    const creditId = req.body.draft_credit_id;
    const titleType = req.body.title_type;
    const siteLanguage = req.body.site_language;
    const seasonId = titleType == "tv" ? req.body.season_id : null;

    // find request id is present or not
    const findRequestId = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: data.request_id,
        type: titleType,
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
      },
    });
    const otherLangRequestId =
      findOtherLangRequestId && findOtherLangRequestId.id ? findOtherLangRequestId.id : "";

    // Credit Id is not present for that request_id create the data else update the data

    if (titleType === "movie") {
      // user cast_list
      let castList = [];
      for (const cast of req.body.cast_details) {
        const element = {
          id: "",
          people_id: cast.people_id,
          creditable_id: "",
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
      }
      data.cast_details = { list: castList };

      // user crew_list
      let crewList = [];
      for (const crew of req.body.crew_details) {
        const element = {
          id: "",
          people_id: crew.people_id,
          creditable_id: "",
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

        // creating req for other language:
        if (otherLangRequestId) {
          data.request_id = otherLangRequestId;
          await model.titleRequestCredit.create(data);
        }

        // creating response
        const creditData = await model.titleRequestCredit.findAll({
          attributes: ["id", "request_id"],
          where: { id: createdCreditId.id },
        });
        let responseDetails = [];
        for (let element of creditData) {
          let requiredFormat = {
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
          const updatedCredit = await model.titleRequestCredit.findAll({
            where: { id: creditId, status: "active" },
          });
          let responseDetails = [];
          for (let element of updatedCredit) {
            let requiredFormat = {
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
      // check for season ID in draft season table:
      const findSeasonRequest = await model.titleRequestSeasonDetails.findOne({
        where: {
          id: seasonId,
          request_id: data.request_id,
          status: "active",
        },
      });

      if (!findSeasonRequest) throw StatusError.badRequest(res.__("Invalid Season ID"));

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

      // checking whether CreditId is already present for that request id and season_id
      const findCreditSeasonWiseId = await model.titleRequestCredit.findOne({
        where: { request_id: data.request_id, request_season_id: seasonId, status: "active" },
      });
      if (!findCreditSeasonWiseId) {
        let castList = [];
        let i = 1;
        for (const cast of req.body.cast_details) {
          const element = {
            temp_id: i,
            id: "",
            people_id: cast.people_id,
            creditable_id: "",
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
        data.cast_details = { list: castList };

        // user crew_list
        let crewList = [];
        let j = 1;
        for (const crew of req.body.crew_details) {
          const element = {
            temp_id: j,
            id: "",
            people_id: crew.people_id,
            creditable_id: "",
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
        data.crew_details = { list: crewList };

        data.request_season_id = seasonId;
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = userId;

        // creating credit ID for the first time
        const createdCreditId = await model.titleRequestCredit.create(data);

        // creating data for other language:
        if (otherLangRequestId && otherLangSeasonReqId) {
          let castOtherLangList = [],
            crewOtherLangList = [];
          data.request_season_id = otherLangSeasonReqId;
          data.request_id = otherLangRequestId;
          let i = 1;
          for (const cast of req.body.cast_details) {
            const element = {
              temp_id: i,
              id: "",
              people_id: cast.people_id,
              creditable_id: "",
              character_name: cast.character_name ? cast.character_name.trim() : null,
              cast_name: !cast.people_id && cast.cast_name ? cast.cast_name.trim() : null,
              poster: cast.poster ? cast.poster : null,
              list_order: cast.order,
              department: "cast",
              job: cast.job,
              creditable_type: "title",
              is_guest: cast.is_guest ? cast.is_guest : 0,
              season_id: otherLangSeasonReqId,
              episode_id: "",
              site_language: otherLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
              tmdb_id: cast.tmdb_id ? cast.tmdb_id : "",
            };
            castOtherLangList.push(element);
            i += 1;
          }
          data.cast_details = { list: castOtherLangList };

          let j = 1;
          for (const crew of req.body.crew_details) {
            const element = {
              temp_id: j,
              id: "",
              people_id: crew.people_id,
              creditable_id: "",
              character_name: "",
              cast_name: !crew.people_id && crew.cast_name ? crew.cast_name.trim() : null,
              poster: crew.poster ? crew.poster : null,
              list_order: crew.order,
              department: "crew",
              job: crew.job,
              creditable_type: "title",
              is_guest: "",
              season_id: otherLangSeasonReqId,
              episode_id: "",
              site_language: otherLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
              tmdb_id: crew.tmdb_id ? crew.tmdb_id : "",
            };
            crewOtherLangList.push(element);
            j += 1;
          }
          data.crew_details = { list: crewOtherLangList };
          await model.titleRequestCredit.create(data);
        }
        // creating response
        const creditData = await model.titleRequestCredit.findAll({
          attributes: ["id", "request_id", "request_season_id"],
          where: { id: createdCreditId.id },
        });
        let responseDetails = [];
        for (let element of creditData) {
          let requiredFormat = {
            draft_request_id: element.request_id,
            draft_credit_id: element.id,
            draft_season_id: element.request_season_id,
          };
          responseDetails.push(requiredFormat);
        }
        res.ok({ data: responseDetails });
      } else {
        // Update the current list
        //  finding credit ID and then adding credit to its existing list
        if (creditId === findCreditSeasonWiseId.id) {
          // getting the cast details that are already saved
          const parsedObject =
            findCreditSeasonWiseId.cast_details != null && findCreditSeasonWiseId.cast_details
              ? JSON.parse(findCreditSeasonWiseId.cast_details)
              : null;
          let castList = parsedObject != null ? parsedObject.list : [];
          for (const cast of req.body.cast_details) {
            const element = {
              id: "",
              people_id: cast.people_id,
              creditable_id: "",
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
            findCreditSeasonWiseId.crew_details != null && findCreditSeasonWiseId.crew_details
              ? JSON.parse(findCreditSeasonWiseId.crew_details)
              : null;
          let crewList = parsedCrewObject != null ? parsedCrewObject.list : [];
          for (const crew of req.body.crew_details) {
            const element = {
              id: "",
              people_id: crew.people_id,
              creditable_id: "",
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
              request_season_id: seasonId,
              status: "active",
            },
          });
          // creating response
          const updatedCredit = await model.titleRequestCredit.findAll({
            where: { id: creditId, status: "active" },
          });
          let responseDetails = [];
          for (let element of updatedCredit) {
            let requiredFormat = {
              draft_request_id: element.request_id,
              draft_credit_id: element.id,
              draft_season_id: element.request_season_id,
            };
            responseDetails.push(requiredFormat);
          }
          res.ok({ data: responseDetails });
        } else {
          throw StatusError.badRequest(res.__("Invalid Credit ID"));
        }
      }
    }
  } catch (error) {
    next(error);
  }
};
