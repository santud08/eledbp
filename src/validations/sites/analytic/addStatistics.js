import { celebrate, Joi } from "celebrate";

export const addStatistics = celebrate({
  body: Joi.object({
    user_session_id: Joi.string().required(),
    utm_source: Joi.string().optional().allow("", null),
    utm_medium: Joi.string().optional().allow("", null),
    utm_campaign: Joi.string().optional().allow("", null),
    utm_term: Joi.string().optional().allow("", null),
    utm_content: Joi.string().optional().allow("", null),
    url: Joi.string().optional().allow("", null),
    referrer: Joi.string().optional().allow("", null),
    title: Joi.string().optional().allow("", null),
    type: Joi.string()
      .optional()
      .valid("movie", "tv", "webtoons", "people", "video", "tag", "company", "award")
      .allow("", null),
    view_at: Joi.date().iso().optional().allow("", null),
    breakaway_at: Joi.date().iso().optional().allow("", null),
    ip: Joi.string()
      .optional()
      .ip({
        version: ["ipv4", "ipv6"], // Specify the IP version(s) you want to allow
      })
      .allow("", null),
    browse_platform: Joi.string().required(), //for blocking the boat request
    statistic_id: Joi.number().optional().allow("", null),
    visit_id: Joi.number().optional().allow("", null),
  }),
});
