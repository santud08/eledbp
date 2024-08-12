import { celebrate, Joi } from "celebrate";
export const submitAllSaveTitle = celebrate({
  body: Joi.object({
    draft_relation_id: Joi.number().required(),
  }),
});
