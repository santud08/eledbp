import { celebrate, Joi } from "celebrate";

export const frontLineMainTopNewsListRefresh = celebrate({
  body: Joi.object({
    list_type: Joi.string().required().valid("movie", "tv_show", "webtoon"),
    feed_url: Joi.string().required(),
  }),
});
