import { celebrate, Joi } from "celebrate";
export const titleSearchForConnections = celebrate({
  query: Joi.object({
    search_text: Joi.string().required(),
    search_type: Joi.string().optional().valid("movie", "tv", "webtoons").allow(""),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
