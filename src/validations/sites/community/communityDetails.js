import { celebrate, Joi } from "celebrate";
export const communityDetails = celebrate({
  body: Joi.object({
    commentable_id: Joi.number().required(),
    season_id: Joi.number().allow(null).allow("").optional(),
    community_type: Joi.string().required().valid("comment", "trivia", "famous_line", "goofs"),
    commentable_type: Joi.string().required().valid("title", "people"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
