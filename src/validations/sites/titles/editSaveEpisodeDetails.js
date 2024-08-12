import { celebrate, Joi } from "celebrate";
export const editSaveEpisodeDetails = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    draft_season_id: Joi.number().optional().allow("", null),
    season_id: Joi.number().optional().allow("", null),
    draft_episode_id: Joi.number().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    episode_details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional().allow("", null),
          action_type: Joi.string().optional().allow("", null),
          name: Joi.string().optional().allow("", null),
          description: Joi.string().optional().allow("", null),
          poster: Joi.string().optional().allow("", null),
          release_date: Joi.date().allow(null).allow("").optional(),
          episode_number: Joi.number().required(),
        }),
      )
      .allow(null)
      .allow("")
      .optional(),
  }),
});
