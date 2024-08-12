import { celebrate, Joi } from "celebrate";

export const frontLineMainTopNewsList = celebrate({
  body: Joi.object({
    list_type: Joi.string().required().valid("movie", "tv_show", "webtoon"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
