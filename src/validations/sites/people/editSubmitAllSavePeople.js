import { celebrate, Joi } from "celebrate";
export const editSubmitAllSavePeople = celebrate({
  body: Joi.object({
    draft_relation_id: Joi.number().required(),
    people_id: Joi.number().required(),
  }),
});
