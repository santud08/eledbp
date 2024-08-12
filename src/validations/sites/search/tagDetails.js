import { celebrate, Joi } from "celebrate";
export const tagDetails = celebrate({
  body: Joi.object({
    tag_id: Joi.number().required(),
    type: Joi.string().required().valid("all", "movie", "tv", "webtoons"),
    page: Joi.number().required().optional(),
    limit: Joi.number().required().optional(),
  }),
});
