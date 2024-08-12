import { celebrate, Joi } from "celebrate";

export const frontLineMainStatusChange = celebrate({
  body: Joi.object({
    area_key: Joi.string()
      .required()
      .valid(
        "top_news",
        "trending",
        "hot_video",
        "comming_soon",
        "latest_trailers",
        "real_time_feeds",
        "most_popular_shows",
        "new_release",
        "born_today",
      ),
    status: Joi.string().required().valid("active", "inactive"),
  }),
});
