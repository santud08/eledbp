import { celebrate, Joi } from "celebrate";
export const submitAllSavePeople = celebrate({
  body: Joi.object({
    draft_relation_id: Joi.number().required(),
  }),
});
