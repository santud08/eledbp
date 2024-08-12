import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";

/**
 * addStatistics
 * @param req
 * @param res
 */
export const addStatistics = async (req, res, next) => {
  try {
    const reqBody = req.body;

    const userSessionId = reqBody.user_session_id ? reqBody.user_session_id : "";
    const browsePlatform = reqBody.browse_platform ? reqBody.browse_platform : null;
    if (!userSessionId) throw StatusError.badRequest(res.__("user session is empty"));
    //for blocking the boat request
    if (!browsePlatform) throw StatusError.badRequest(res.__("browse platform is empty"));

    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    const email = req.userDetails && req.userDetails.email ? req.userDetails.email : null;

    const utmSource = reqBody.utm_source ? reqBody.utm_source : null;
    const utmMedium = reqBody.utm_medium ? reqBody.utm_medium : null;
    const utmCampaign = reqBody.utm_campaign ? reqBody.utm_campaign : null;
    const utmTerm = reqBody.utm_term ? reqBody.utm_term : null;
    const utmContent = reqBody.utm_content ? reqBody.utm_content : null;

    const type = reqBody.type ? reqBody.type : null;

    const pageUrl = reqBody.url ? reqBody.url : null;
    const referrerUrl = reqBody.referrer ? reqBody.referrer : null;
    const pageTitle = reqBody.title ? reqBody.title : null;
    let viewAt = reqBody.view_at
      ? await customDateTimeHelper.getKoreanDateTimeFromUTC(reqBody.view_at, "YYYY-MM-DD HH:mm:ss")
      : null;
    const breakawayAt = reqBody.breakaway_at
      ? await customDateTimeHelper.getKoreanDateTimeFromUTC(
          reqBody.breakaway_at,
          "YYYY-MM-DD HH:mm:ss",
        )
      : null;
    const ip = reqBody.ip ? reqBody.ip : null;

    let activityId = reqBody.statistic_id ? reqBody.statistic_id : null;
    let pageVisitId = reqBody.visit_id ? reqBody.visit_id : null;

    const userAgent = req.headers && req.headers["user-agent"] ? req.headers["user-agent"] : null;

    const language = req.accept_language;

    if (activityId > 0) {
      const getActivity = await model.activity.findOne({
        where: { id: activityId, status: "active" },
      });

      if (getActivity) {
        const firstViewAt = getActivity.session_start_at ? getActivity.session_start_at : viewAt;
        const updateLogData = {
          session_end_at: breakawayAt,
          session_duration:
            firstViewAt && breakawayAt
              ? await customDateTimeHelper.calculateDifferentBetweenDate(firstViewAt, breakawayAt)
              : null,
          updated_by: userId,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        await model.activity.update(updateLogData, { where: { id: activityId } });
      } else {
        const logData = {
          user_session_id: userSessionId,
          ip: ip,
          access_platform: browsePlatform,
          session_start_at: viewAt,
          session_end_at: breakawayAt,
          session_duration:
            viewAt && breakawayAt
              ? await customDateTimeHelper.calculateDifferentBetweenDate(viewAt, breakawayAt)
              : null,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: utmTerm,
          utm_content: utmContent,
          created_by: userId,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        const retRes = await model.activity.create(logData);
        if (retRes && retRes.id > 0) {
          activityId = retRes.id;
        }
      }
    } else {
      const logData = {
        user_session_id: userSessionId,
        ip: ip,
        access_platform: browsePlatform,
        session_start_at: viewAt,
        session_end_at: breakawayAt,
        session_duration:
          viewAt && breakawayAt
            ? await customDateTimeHelper.calculateDifferentBetweenDate(viewAt, breakawayAt)
            : null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
        created_by: userId,
        created_at: await customDateTimeHelper.getCurrentDateTime(),
      };
      const retRes = await model.activity.create(logData);
      if (retRes && retRes.id > 0) {
        activityId = retRes.id;
      }
    }
    if (activityId > 0) {
      if (pageVisitId > 0) {
        const getPageVisit = await model.pageVisit.findOne({
          where: { id: pageVisitId, activity_id: activityId, status: "active" },
        });
        if (getPageVisit) {
          const updatePageVisitData = {
            view_end_at: breakawayAt,
            view_duration:
              viewAt && breakawayAt
                ? await customDateTimeHelper.calculateDifferentBetweenDate(viewAt, breakawayAt)
                : null,
            updated_by: userId,
            updated_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          await model.pageVisit.update(updatePageVisitData, {
            where: { id: pageVisitId },
          });
        } else {
          const pageVisitData = {
            activity_id: activityId,
            user_id: userId,
            user_email: email,
            page_url: pageUrl,
            referrer_url: referrerUrl,
            page_title: pageTitle,
            view_start_at: viewAt,
            view_end_at: breakawayAt,
            view_duration:
              viewAt && breakawayAt
                ? await customDateTimeHelper.calculateDifferentBetweenDate(viewAt, breakawayAt)
                : null,
            page_type: type,
            details: { site_language: language, agent_information: userAgent },
            created_by: userId,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          const retVisit = await model.pageVisit.create(pageVisitData);
          if (retVisit && retVisit.id > 0) {
            pageVisitId = retVisit.id;
          }
        }
      } else {
        const pageVisitData = {
          activity_id: activityId,
          user_id: userId,
          user_email: email,
          page_url: pageUrl,
          referrer_url: referrerUrl,
          page_title: pageTitle,
          view_start_at: viewAt,
          view_end_at: breakawayAt,
          view_duration:
            viewAt && breakawayAt
              ? await customDateTimeHelper.calculateDifferentBetweenDate(viewAt, breakawayAt)
              : null,
          page_type: type,
          details: { site_language: language, agent_information: userAgent },
          created_by: userId,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        const retVisit = await model.pageVisit.create(pageVisitData);
        if (retVisit && retVisit.id > 0) {
          pageVisitId = retVisit.id;
        }
      }
    }
    res.ok({
      user_session_id: userSessionId,
      statistic_id: activityId,
      visit_id: pageVisitId,
    });
  } catch (error) {
    next(error);
  }
};
