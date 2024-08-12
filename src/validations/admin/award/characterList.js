import { celebrate, Joi } from "celebrate";

export const characterList = celebrate({
  query: Joi.object({
    title_id: Joi.number().optional().allow("", null),
    type: Joi.string().optional().valid("movie", "tv", "webtoons", "", null),
    search_text: Joi.string().required().allow("", null),
    page: Joi.number().required().allow("", null),
    limit: Joi.number().required().allow("", null),
  }),
});
