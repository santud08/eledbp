import { celebrate, Joi } from "celebrate";

export const awardItemsDetails = celebrate({
  params: Joi.object({
    type: Joi.number().required().valid("movie", "tv", "webtoons", "people"),
    id: Joi.number().required(),
  }),
});
