import { celebrate, Joi } from "celebrate";

export const getWebtoonsEpisodeDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
  query: Joi.object({
    language: Joi.string().required(),
    episode_id: Joi.number().optional().allow("", null),
    episode_number: Joi.number().optional().allow("", null),
  }),
});
