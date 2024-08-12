import { celebrate, Joi } from "celebrate";
export const registeredCountryList = celebrate({
  query: Joi.object({
    type: Joi.string().required().valid("movie", "tv", "people"),
  }),
});
