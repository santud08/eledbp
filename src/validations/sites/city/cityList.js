import { celebrate, Joi } from "celebrate";
export const cityList = celebrate({
  body: Joi.object({
    country_id: Joi.number().required(),
    search_text: Joi.string().optional().allow("", null),
  }),
});
