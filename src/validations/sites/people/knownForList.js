import { celebrate, Joi } from "celebrate";
export const knownForList = celebrate({
  query: Joi.object({
    person_id: Joi.number().required(),
  }),
});
