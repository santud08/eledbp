import { celebrate, Joi } from "celebrate";

export const frontLineMainTopNewsEdit = celebrate({
  body: Joi.object({
    list_type: Joi.string().required().valid("movie", "tv_show", "webtoon"),
    news_id: Joi.number().required(),
    id: Joi.number().optional().allow("", null),
    status: Joi.string().required().valid("active", "inactive"),
  }),
});
